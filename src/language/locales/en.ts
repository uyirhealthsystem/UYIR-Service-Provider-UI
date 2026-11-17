export default {
  common: {
    back: "Back",
    next: "Next",
    submit: "Submit",
    verify: "Verify",
    resend: "Resend code",
    cancel: "Cancel",
  },

  auth: {
    login: {
      title: "Welcome back",
      subtitle: "Login to your provider account",
      email: "Email address",
      password: "Password",
      forgotPassword: "Forgot password?",
      login: "Login",
      or: "or",
      google: "Continue with Google",
      noAccount: "Don't have an account?",
      register: "Register",
    },

    register: {
      title: "Create your account",
      subtitle: "Create your provider account to get started.",
      email: "Email address",
      password: "Password",
      confirmPassword: "Confirm password",
      register: "Register",
      or: "or",
      google: "Sign up with Google",
      haveAccount: "Already have an account?",
      login: "Login",
    },

    otp: {
      title: "Verify your account",
      subtitle: "Enter the verification code sent to your email.",
      placeholder: "Enter OTP",
      verify: "Verify",
      resend: "Resend code",
    },
  },

  provider: {
    type: {
      title: "Choose Provider Type",
      subtitle: "Select the type of service you provide.",
      pro: "Professional service provider",
      ambulance: "Emergency and patient transport services",
      laboratory: "Diagnostic and pathology services",
    },

    onboarding: {
      pro: {
        title: "PRO Details",
        subtitle: "Complete your service provider profile.",
        businessName: "Business name",
        ownerName: "Owner / Contact person",
        phone: "Phone number",
        serviceArea: "Service area",
        address: "Business address",
      },

      ambulance: {
        title: "Ambulance Details",
        subtitle: "Provide your ambulance service details.",
        businessName: "Business name",
        ownerName: "Owner name",
        phone: "Phone number",
        serviceArea: "Service area",
        vehicleCount: "Number of vehicles",
        registrationNumber: "Ambulance registration number",
      },

      laboratory: {
        title: "Laboratory Details",
        subtitle: "Provide your laboratory details.",
        laboratoryName: "Laboratory name",
        administratorName: "Owner / Administrator name",
        phone: "Phone number",
        address: "Laboratory address",
        registrationNumber: "Registration number",
        licenseNumber: "License number",
      },

      submit: "Submit for Approval",
    },

    approval: {
      title: "Your account is under review",
      submitted:
        "Thank you! Your registration has been submitted successfully.",
      waiting: "We will notify you once your account is approved.",
      login: "Go to Login",
    },
  },

  dynamic: {
    vehicles: "Vehicles: {count}",
    welcomeUser: "Welcome, {name}",
    serviceCount: "{count} services available",
  },
} as const;
