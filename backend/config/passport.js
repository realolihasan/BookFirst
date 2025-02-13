// Path: backend/config/passport.js

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

function configurePassport() {
  passport.serializeUser((user, done) => {
    console.log("Serializing user:", user._id);
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    console.log("Deserializing user with id:", id);
    try {
      const user = await User.findById(id);
      if (!user) {
        console.warn("User not found during deserialization:", id);
        return done(null, null);
      }
      console.log("Deserialized user:", user);
      done(null, user);
    } catch (error) {
      console.error("Error during deserialization:", error);
      done(error, null);
    }
  });

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback";

  console.log("Initializing Passport with credentials:", {
    GOOGLE_CLIENT_ID: !!GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("Google auth callback - profile:", profile);
          
          let user = await User.findOne({ email: profile.emails[0].value });

          if (!user) {
            console.log("Creating new user for:", profile.emails[0].value);
            user = new User({
              email: profile.emails[0].value,
              name: profile.displayName,
              picture: profile.photos?.[0]?.value,
              role: 'public',
              googleId: profile.id
            });
            await user.save();
            console.log("New user created:", user);
          } else {
            console.log("Existing user found:", user);
            if (!user.googleId) {
              user.googleId = profile.id;
              user.picture = profile.photos?.[0]?.value;
              await user.save();
              console.log("Updated existing user with Google info");
            }
          }

          return done(null, user);
        } catch (error) {
          console.error("Error in Google Strategy callback:", error);
          return done(error, null);
        }
      }
    )
  );

  return passport;
}

module.exports = configurePassport;