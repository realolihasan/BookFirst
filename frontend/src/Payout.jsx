import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Payout = ({ booking, onUpdate }) => {
  const [payoutRecipients, setPayoutRecipients] = useState([]);
  const [availableProfiles, setAvailableProfiles] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentRowId, setCurrentRowId] = useState(null);
  const [profileModalSearchTerm, setProfileModalSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [generatingId, setGeneratingId] = useState(null); // Track which row is generating

  // Initialize from booking.payoutStatements
  useEffect(() => {
    if (booking.payoutStatements?.length > 0) {
      const existingRecipients = booking.payoutStatements.map(ps => ({
        id: ps.recipientId,
        profileId: ps.recipientId,
        percentage: ps.percentage,
        calculatedAmount: ps.amount,
        statementNumber: ps.statementNumber,
        status: ps.status,
        generated: true,
        generatedDate: ps.generatedDate
      }));
      setPayoutRecipients(existingRecipients);
    } else {
      setPayoutRecipients([]);
    }
  }, [booking.payoutStatements]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await axios.get('/api/users?roles=MODEL,CO_ADMIN');
      setAvailableProfiles(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch profiles', err);
      setError('Failed to load profiles');
    }
  };

  const handleAddRecipient = () => {
    const newRecipient = {
      id: Date.now(), // Temporary ID for new recipients
      profileId: '',
      percentage: '',
      calculatedAmount: null,
      statementNumber: null,
      generated: false,
      status: "pending"
    };
    setPayoutRecipients([...payoutRecipients, newRecipient]);
  };

  const handleDeleteRecipient = (id) => {
    const recipient = payoutRecipients.find(r => r.id === id);
    if (recipient.generated) {
      setError("Cannot delete a generated payout statement");
      return;
    }
    setPayoutRecipients(payoutRecipients.filter((r) => r.id !== id));
  };

  const handleProfileChange = (id, profileId) => {
    setPayoutRecipients(
      payoutRecipients.map((r) =>
        r.id === id ? { ...r, profileId } : r
      )
    );
  };

  const handlePercentageChange = (id, percentage) => {
    const recipient = payoutRecipients.find(r => r.id === id);
    if (recipient.generated) {
      setError("Cannot modify percentage after statement generation");
      return;
    }

    const newVal = parseFloat(percentage) || 0;
    const otherTotal = payoutRecipients
      .filter((r) => r.id !== id)
      .reduce((sum, r) => sum + (parseFloat(r.percentage) || 0), 0);

    if (otherTotal + newVal > 100) {
      setError("Total percentage cannot exceed 100%");
      return;
    }

    setPayoutRecipients(
      payoutRecipients.map((r) =>
        r.id === id ? { ...r, percentage: percentage } : r
      )
    );
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`/api/payouts/${booking._id}/status`, {
        recipientId: id,
        status: newStatus
      });

      setPayoutRecipients(
        payoutRecipients.map((r) =>
          r.id === id ? { ...r, status: newStatus } : r
        )
      );

      if (onUpdate) onUpdate();
    } catch (err) {
      setError('Failed to update status');
      console.error('Status update failed:', err);
    }
  };

  const computeAmount = (percentage) => {
    if (booking.invoice && booking.invoice.amount) {
      return parseFloat(booking.invoice.amount * (percentage / 100)).toFixed(2);
    }
    return '--';
  };

  const handleGenerateAndSave = async (recipientId) => {
    const recipient = payoutRecipients.find((r) => r.id === recipientId);
    if (!recipient || recipient.generated) return;

    setGeneratingId(recipientId);
    setError(null);

    try {
      const response = await axios.post(
        `/api/payouts/generate/${booking._id}`,
        {
          userId: recipient.profileId,
          percentage: recipient.percentage
        }
      );

      setPayoutRecipients(current =>
        current.map(r => 
          r.id === recipientId
            ? {
                ...r,
                calculatedAmount: computeAmount(r.percentage),
                statementNumber: response.data.data.statementNumber,
                generated: true,
                generatedDate: new Date()
              }
            : r
        )
      );

      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate payout statement');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDownloadStatement = async (recipientId) => {
    const recipient = payoutRecipients.find((r) => r.id === recipientId);
    if (!recipient || !recipient.generated) return;

    try {
        const response = await axios.get(
            `/api/payouts/download/${booking._id}/${recipientId}`,
            { responseType: 'blob' }
        );

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payout-${recipient.statementNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        setError('Failed to download statement');
    }
};

  const renderProfileModal = () => (
    <div className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="modal-content bg-gray-800 p-4 rounded max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Select Profile</h2>
          <button
            onClick={() => setShowProfileModal(false)}
            className="text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>
        <input
          type="text"
          value={profileModalSearchTerm}
          onChange={(e) => setProfileModalSearchTerm(e.target.value)}
          placeholder="Search by name or email..."
          className="input w-full mb-4"
        />
        <div className="max-h-60 overflow-y-auto">
          {availableProfiles
            .filter((p) =>
              p.name.toLowerCase().includes(profileModalSearchTerm.toLowerCase()) ||
              p.email.toLowerCase().includes(profileModalSearchTerm.toLowerCase())
            )
            .map((p) => (
              <div
                key={p._id}
                className="p-2 hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2"
                onClick={() => {
                  handleProfileChange(currentRowId, p._id);
                  setShowProfileModal(false);
                }}
              >
                <img
                  src={p.picture}
                  alt={p.name}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => e.target.style.display = 'none'}
                />
                <div>
                  <p className="text-sm text-white">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.email}</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          {booking.invoice ? (
            <p className="text-lg font-semibold text-gray-300">
              Invoice Amount: {booking.invoice.amount} {booking.invoice.currency}
            </p>
          ) : (
            <p className="text-lg font-semibold text-gray-300">
              No invoice generated
            </p>
          )}
        </div>
        <button
          onClick={handleAddRecipient}
          className="btn-secondary"
        >
          Add Recipient
        </button>
      </div>

      {error && (
        <div className="alert-error mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right">×</button>
        </div>
      )}

      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 font-semibold text-gray-300 border-b border-gray-600 pb-2">
        <div>Profile</div>
        <div className="text-center">%</div>
        <div className="text-center">Amount</div>
        <div className="text-center">Generate & Save</div>
        <div className="text-center">Download</div>
        <div className="text-center">Status</div>
        <div className="text-center">Delete</div>
      </div>

      {payoutRecipients.map((recipient) => (
        <div
          key={recipient.id}
          className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center py-4 border-b border-gray-700"
        >
          <div>
            {recipient.profileId ? (
              (() => {
                const profile = availableProfiles.find(
                  (p) => p._id === recipient.profileId
                );
                return profile ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={profile.picture}
                      alt={profile.name}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <div>
                      <p className="text-sm">{profile.name}</p>
                      <p className="text-xs text-gray-400">{profile.email}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Select Profile</span>
                );
              })()
            ) : (
              <button
                onClick={() => {
                  setCurrentRowId(recipient.id);
                  setShowProfileModal(true);
                }}
                className="btn-secondary px-2 py-1 text-sm"
              >
                Select Profile
              </button>
            )}
          </div>

          <div className="text-center">
            <input
              type="number"
              value={recipient.percentage}
              onChange={(e) => handlePercentageChange(recipient.id, e.target.value)}
              className={`input w-20 text-center ${recipient.generated ? 'bg-gray-700 cursor-not-allowed' : ''}`}
              disabled={recipient.generated}
              placeholder="%"
            />
          </div>

          <div className="text-center">
            {recipient.calculatedAmount || computeAmount(recipient.percentage)}
          </div>

          <div className="text-center">
            {recipient.generated ? (
              <span className="text-gray-400">Generated</span>
            ) : (
              <button
                onClick={() => handleGenerateAndSave(recipient.id)}
                className={`btn-secondary px-2 py-1 text-sm ${generatingId === recipient.id ? 'opacity-50' : ''}`}
                disabled={!recipient.profileId || !recipient.percentage || generatingId === recipient.id}
              >
                {generatingId === recipient.id ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="spinner-sm" />
                    <span>Generating...</span>
                  </div>
                ) : 'Generate & Save'}
              </button>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={() => handleDownloadStatement(recipient.id)}
              className={`btn-secondary px-2 py-1 text-sm ${!recipient.generated ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!recipient.generated}
            >
              Download
            </button>
          </div>

          <div className="text-center">
            <select
              value={recipient.status}
              onChange={(e) => handleStatusChange(recipient.id, e.target.value)}
              className={`select text-center text-sm ${!recipient.generated ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!recipient.generated}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div className="text-center">
            <button
              onClick={() => handleDeleteRecipient(recipient.id)}
              className={`btn-danger px-2 py-1 text-sm ${recipient.generated ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={recipient.generated}
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {showProfileModal && renderProfileModal()}
    </div>
  );
};

export default Payout;