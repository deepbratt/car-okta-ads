const mongoose = require('mongoose');
const validator = require('validator');
const { ERRORS } = require('@constants/tdb-constants');

const userSchema = new mongoose.Schema(
  {
    // facebookId: {
    // 	type: String,
    // },
    // googleId: {
    // 	type: String,
    // },
    // displayName: {
    // 	type: String,
    // },
    firstName: {
      type: String,
      minlength: 3,
      maxlength: 15,
      required: [true, ERRORS.REQUIRED.FIRSTNAME_REQUIRED],
      // validate: [validator.isAlpha, ERRORS.INVALID.INVALID_FIRSTNAME],
    },
    // middleName: {
    // 	type: String,
    // },
    lastName: {
      type: String,
      minlength: 3,
      maxlength: 15,
      required: [true, ERRORS.REQUIRED.LASTNAME_REQUIRED],
      validate: [validator.isAlpha, ERRORS.INVALID.INVALID_LASTNAME],
    },
    email: {
      type: String,
      lowercase: true,
      validate: [validator.isEmail, ERRORS.INVALID.INVALID_SIGNUP_CREDENTIALS],
    },
    phone: {
      type: String,
      validate: [validator.isMobilePhone, ERRORS.INVALID.INVALID_SIGNUP_CREDENTIALS],
    },
    username: {
      type: String,
      required: [true, ERRORS.REQUIRED.USERNAME_REQUIRED],
      minlength: [5, ERRORS.INVALID.USERNAME_LENGTH],
    },
    password: {
      type: String,
      minlength: [8, ERRORS.INVALID.PASSWORD_LENGTH],
      select: false,
    },
    passwordConfirm: {
      type: String,
      minlength: [8, ERRORS.INVALID.PASSWORD_LENGTH],
      select: false,
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: ERRORS.INVALID.PASSWORD_MISMATCH,
      },
    },
    gender: {
      type: String,
      enum: {
        values: ['Male', 'Female'],
      },
      message: ERRORS.INVALID.INVALID_GENDER,
    },
    country: {
      type: String,
      lowercase: true,
      trim: true,
    },
    city: {
      type: String,
      lowercase: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date, // Format  => year-month-day
      trim: true,
    },
    image: {
      type: String,
    },
    signedUpWithEmail: {
      type: Boolean,
      default: false,
    },
    signedUpWithPhone: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: 'User',
      enum: {
        values: ['User', 'Moderator', 'Admin'],
        message: 'Role Must be User, Moderator or Admin',
      },
    },
    // isVerified: {
    // 	type: Boolean,
    // 	default: false,
    // isEmailVerified: {
    // 	type: Boolean,
    // 	default: false,
    // },
    // isPhoneVerified: {
    // 	type: Boolean,
    // 	default: false,
    // },
    // emailVerificationCode: {
    // 	type: String,
    // 	select: false,
    // },
    // phoneVerificationCode: {
    // 	type: String,
    // 	select: false,
    // },
    // emailVerificationTokenExpires: {
    // 	type: Date,
    // 	select: false,
    // },
    // phoneVerificationTokenExpires: {
    // 	type: Date,
    // 	select: false,
    // },
    // loggedInWithPhone: {
    // 	type: Boolean,
    // 	default: false,
    // },
    // loggedInWithEmail: {
    // 	type: Boolean,
    // 	default: false,
    // },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    passwordChangedAt: Date,
    active: {
      type: Boolean,
      default: true,
    },
    banned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

//CHANGED_PASSWORD_AFTER
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
