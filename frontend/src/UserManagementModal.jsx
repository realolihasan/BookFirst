// Path: frontend/src/UserManagementModal.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './AuthContext';

const UserManagementModal = () => {
 const navigate = useNavigate();
 const { user: currentUser } = useAuth();
 const [users, setUsers] = useState([]);
 const [portfolios, setPortfolios] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [search, setSearch] = useState('');
 const [page, setPage] = useState(1);
 const [newUser, setNewUser] = useState({ 
   name: '', 
   email: '', 
   role: 'public' 
 });
 const [selectedPortfolio, setSelectedPortfolio] = useState(null);
 const usersPerPage = 10;

 useEffect(() => {
   fetchData();
 }, []);

 const fetchData = async () => {
   try {
     setLoading(true);
     const [usersResponse, portfoliosResponse] = await Promise.all([
       axios.get('/api/users'),
       axios.get('/api/portfolios')
     ]);
     setUsers(usersResponse.data.data);
     setPortfolios(portfoliosResponse.data.data);
   } catch (err) {
     setError('Failed to load data');
     console.error('Error fetching data:', err);
   } finally {
     setLoading(false);
   }
 };

 const handleRoleUpdate = async (userId, newRole, portfolioId = null) => {
   try {
     setError(null);
     await axios.post('/api/users/role', {
       userId,
       role: newRole,
       portfolioId
     });
     fetchData();
   } catch (err) {
     setError(err.response?.data?.message || 'Failed to update role');
   }
 };

 const handleDeleteUser = async (userId) => {
   if (!window.confirm('Are you sure you want to delete this user?')) return;
   try {
     await axios.delete(`/api/users/${userId}`);
     fetchData();
   } catch (err) {
     setError('Failed to delete user');
   }
 };

 const getConnectedPortfolio = (user) => {
   if (user.role !== 'model' || !user.portfolioId) return null;
   return portfolios.find(p => p._id === user.portfolioId);
 };

 const handleSubmit = async (e) => {
   e.preventDefault();
   if (!newUser.email.endsWith('@gmail.com')) {
     setError('Only Gmail addresses are allowed');
     return;
   }

   if (newUser.role === 'model' && !selectedPortfolio) {
     setError('Please select a portfolio for the model');
     return;
   }

   try {
     const response = await axios.post('/api/users', newUser);
     if (newUser.role === 'model') {
       await handleRoleUpdate(response.data.data._id, 'model', selectedPortfolio._id);
     }
     setNewUser({ name: '', email: '', role: 'public' });
     setSelectedPortfolio(null);
     fetchData();
   } catch (err) {
     setError(err.response?.data?.message || 'Failed to create user');
   }
 };

 if (loading) {
   return (
     <div className="page-container flex-center">
       <div className="spinner-lg" />
     </div>
   );
 }

 const filteredUsers = users.filter(user => 
   user.email.toLowerCase().includes(search.toLowerCase()) ||
   user.name.toLowerCase().includes(search.toLowerCase()) ||
   user.role.toLowerCase().includes(search.toLowerCase())
 );

 return (
   <div className="page-container">
     <div className="container mx-auto px-4">
       {/* Header */}
       <div className="flex justify-between items-center margin-stack">
         <button
           onClick={() => navigate('/dashboard')}
           className="btn-secondary"
         >
           Back to Dashboard
         </button>
       </div>

       {/* Add User Section */}
       <div className="bg-gray-900/50 p-6 rounded-xl margin-stack">
         <h2 className="h2 mb-4">Add New User</h2>
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="flex gap-4">
             <input
               type="text"
               placeholder="Name"
               value={newUser.name}
               onChange={e => setNewUser({...newUser, name: e.target.value})}
               className="input flex-1"
               required
             />
             <input
               type="email"
               placeholder="Gmail address"
               value={newUser.email}
               onChange={e => setNewUser({...newUser, email: e.target.value})}
               className="input flex-1"
               required
             />
             <select
               value={newUser.role}
               onChange={e => {
                 setNewUser({...newUser, role: e.target.value});
                 if (e.target.value !== 'model') {
                   setSelectedPortfolio(null);
                 }
               }}
               className="select w-48"
             >
               <option value="public">Public</option>
               <option value="model">Model</option>
               <option value="co_admin">Co-Admin</option>
             </select>
             <button type="submit" className="btn-secondary">
               Add User
             </button>
           </div>

           {newUser.role === 'model' && (
             <div className="mt-4">
               <h3 className="text-lg font-medium mb-3">Select Portfolio</h3>
               <div className="grid grid-cols-5 gap-4 max-h-[400px] overflow-y-auto">
                 {portfolios
                   .filter(p => !users.find(u => u.portfolioId === p._id))
                   .map(portfolio => (
                     <div
                       key={portfolio._id}
                       onClick={() => setSelectedPortfolio(portfolio)}
                       className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                         ${selectedPortfolio?._id === portfolio._id 
                           ? 'border-purple-500' 
                           : 'border-transparent hover:border-purple-300'}`}
                     >
                       <div className="aspect-[3/4] relative">
                         <img
                           src={`/api/portfolios/${portfolio._id}/featured-image`}
                           alt={portfolio.modelName}
                           className="w-full h-full object-cover"
                         />
                         <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                           <p className="text-white text-sm font-medium">{portfolio.modelName}</p>
                         </div>
                       </div>
                     </div>
                   ))}
               </div>
             </div>
           )}
         </form>
       </div>

       {/* Search & Filters */}
       <div className="bg-gray-900/50 p-4 rounded-xl margin-stack">
         <input
           type="text"
           placeholder="Search users by name, email, or role..."
           value={search}
           onChange={(e) => setSearch(e.target.value)}
           className="input w-full"
         />
       </div>

       {error && (
         <div className="alert-error mb-4">
           {error}
           <button onClick={() => setError(null)} className="float-right">×</button>
         </div>
       )}

       {/* Users Grid */}
       <div className="grid gap-4">
         {/* Header Row */}
         <div className="grid grid-cols-[2fr_3fr_1.5fr_2fr_2fr_1fr] gap-4 p-8 bg-gray-800 rounded-lg font-medium text-gray-300">
           <div>User</div>
           <div>Email</div>
           <div>Role</div>
           <div>Connected Portfolio</div>
           <div>Last Login</div>
           <div>Actions</div>
         </div>

         {/* User Rows */}
         {filteredUsers
           .slice((page - 1) * usersPerPage, page * usersPerPage)
           .map(user => {
             const connectedPortfolio = getConnectedPortfolio(user);
             
             return (
               <div key={user._id} className="grid grid-cols-[2fr_3fr_1.5fr_2fr_2fr_1fr] gap-4 p-8 bg-gray-900/50 rounded-lg items-center min-h-[120px]">
                 {/* User Info */}
                 <div className="flex items-center gap-3">
                   {user.picture && (
                     <img
                       src={user.picture}
                       alt={user.name}
                       className="w-10 h-10 rounded-full"
                       onError={(e) => e.target.style.display = 'none'}
                     />
                   )}
                   <span className="font-medium">{user.name}</span>
                 </div>

                 {/* Email */}
                 <div className="text-gray-400">{user.email}</div>

                 {/* Role Selector */}
                 <div>
                   <select
                     value={user.role}
                     onChange={async (e) => {
                       const newRole = e.target.value;
                       if (newRole === 'model') {
                         const availablePortfolios = portfolios.filter(
                           p => !users.find(u => u.portfolioId === p._id)
                         );
                         if (availablePortfolios.length === 0) {
                           setError('No available portfolios');
                           return;
                         }
                         setSelectedPortfolio(null);
                         // Show portfolio selection UI here
                       } else {
                         await handleRoleUpdate(user._id, newRole);
                       }
                     }}
                     disabled={user.email === currentUser.email}
                     className="select w-full"
                   >
                     <option value="public">Public</option>
                     <option value="model">Model</option>
                     <option value="co_admin">Co-Admin</option>
                     <option value="admin">Admin</option>
                   </select>
                 </div>

                 {/* Connected Portfolio */}
                 <div>
                   {connectedPortfolio ? (
                     <div 
                       className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                       onClick={() => navigate(`/portfolio/${connectedPortfolio._id}`)}
                     >
                       <img
                         src={`/api/portfolios/${connectedPortfolio._id}/featured-image`}
                         alt={connectedPortfolio.modelName}
                         className="w-8 h-12 object-cover rounded"
                       />
                       <span className="mt-2 text-center text-sm">{connectedPortfolio.modelName}</span>
                     </div>
                   ) : (
                     <span className="text-gray-500">-</span>
                   )}
                 </div>

                 {/* Last Login */}
                 <div className="text-gray-400">
                   {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                 </div>

                 {/* Actions */}
                 <div>
                   {user.email !== currentUser.email && (
                     <button
                       onClick={() => handleDeleteUser(user._id)}
                       className="btn-danger"
                     >
                       Delete
                     </button>
                   )}
                 </div>
               </div>
             );
           })}
       </div>

       {/* Pagination */}
       <div className="flex justify-center gap-2 mt-8">
  {Array.from({ length: Math.ceil(filteredUsers.length / usersPerPage) }).map((_, index) => (
    <button
      key={index}
      onClick={() => setPage(index + 1)}
      className={`px-12 py-2 rounded-lg transition-all duration-300
                 shadow-lg shadow-white/10 backdrop-blur-md
                 active:scale-95 ${
        page === index + 1 
          ? 'bg-white/80 text-black border border-black/30 hover:bg-white hover:border-black/50 hover:shadow-xl' 
          : 'bg-black/80 text-white border border-white/30 hover:bg-black hover:border-white/50 hover:shadow-xl'
      }`}
    >
      {index + 1}
    </button>
  ))}
</div>

       {filteredUsers.length === 0 && (
         <div className="text-center py-8 text-gray-400">
           No users found matching your search.
         </div>
       )}
     </div>
   </div>
 );
};

export default UserManagementModal;