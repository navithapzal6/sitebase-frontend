// validationPatterns.ts

export const patterns = {
  email: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: "Invalid email address",
  },

  phone: {
    value: /^[0-9]{10}$/,
    message: "Enter valid 10 digit phone number",
  },

  pincode: {
    value: /^[1-9][0-9]{5}$/,
    message: "Enter valid 6 digit pincode",
  },

  aadhaar: {
    value: /^[2-9][0-9]{11}$/,
    message: "Enter valid 12 digit Aadhaar number",
  },

  pan: {
    value: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    message: "Enter valid PAN number",
  },

  gstin: {
    value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
    message: "Enter valid 15 character GST number",
  },

  ifsc: {
    value: /^[A-Z]{4}0[A-Z0-9]{6}$/,
    message: "Enter valid 11 character IFSC code",
  },

  positiveAmount: {
    value: /^(?!0+(?:\.0+)?$)[0-9]+(?:\.[0-9]{1,2})?$/,
    message: "Enter an amount greater than zero (maximum 2 decimals)",
  },

  positiveInteger: {
    value: /^[1-9][0-9]*$/,
    message: "Enter a whole number greater than zero",
  },

  onlyNumbers: {
    value: /^[0-9]+$/,
    message: "Only numbers allowed",
  },

  onlyAlphabets: {
    value: /^[A-Za-z\s]+$/,
    message: "Only alphabets allowed",
  },

  alphanumeric: {
    value: /^[A-Za-z0-9]+$/,
    message: "Only letters and numbers allowed",
  },
  password: {
    value: /^(?=.{8,}$)(?=.*[A-Z])(?=.*[\p{P}\p{S}]).*$/u,
    message:
      "Password must contain at least 8 characters, one capital letter and one special character",
  },
};
