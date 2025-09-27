// Translation system for multi-language support (English and Hindi only)

export const translations = {
  en: {
    // Navigation
    nav: {
      home: "Home",
      report: "Report Issue",
      community: "Community",
      myReports: "My Reports",
      settings: "Settings",
      signIn: "Sign In",
      signOut: "Sign Out",
      profile: "Profile"
    },
    
    // Hero Section
    hero: {
      badge: "Municipal Services Platform",
      title: {
        part1: "Report Issues,",
        part2: "Build Community"
      },
      subtitle: "Help improve your city by reporting local issues. From potholes to broken streetlights, your voice matters in building a better community for everyone.",
      reportButton: "Report an Issue",
      watchDemo: "Watch Demo",
      stats: {
        issuesResolved: "Issues Resolved",
        activeCitizens: "Active Citizens",
        responseRate: "Response Rate",
        userRating: "User Rating"
      },
      floatingCards: {
        resolved: {
          title: "Issue Resolved!",
          subtitle: "Pothole on Main St"
        },
        upvotes: {
          title: "+23 Upvotes",
          subtitle: "Community Support"
        }
      },
      howItWorks: {
        title: "How It Works",
        subtitle: "Simple, effective, and transparent. Report issues in three easy steps and watch your community improve.",
        step1: {
          title: "1. Report the Issue",
          description: "Take a photo, describe the problem, and add location details. Our form makes it quick and easy."
        },
        step2: {
          title: "2. Track Progress",
          description: "Monitor your report's status and receive updates as municipal teams work to resolve the issue."
        },
        step3: {
          title: "3. Build Community",
          description: "Earn civic points, support others' reports, and see the positive impact on your neighborhood."
        }
      }
    },
    
    // Report Form
    reportForm: {
      title: "Report a Civic Issue",
      subtitle: "Help improve your community by reporting local issues",
      signInRequired: "Sign In Required",
      signInMessage: "Please sign in to your account to report civic issues and help improve your community.",
      fields: {
        title: "Issue Title",
        category: "Issue Category",
        photos: "Add Photos (Optional)",
        description: "Description",
        location: "Location"
      },
      placeholders: {
        title: "Brief summary of the issue",
        category: "Select the type of issue",
        description: "Describe the issue in detail...",
        location: "Enter address or location"
      },
      buttons: {
        takePhoto: "Take Photo",
        uploadFiles: "Upload Files",
        submit: "Submit Report",
        submitting: "Submitting...",
        voice: "Voice",
        stop: "Stop"
      },
      categories: {
        roadMaintenance: "Road Maintenance",
        wasteManagement: "Waste Management",
        waterUtilities: "Water & Utilities",
        lighting: "Street Lighting",
        vandalism: "Vandalism",
        traffic: "Traffic & Signals",
        infrastructure: "Infrastructure",
        other: "Other"
      },
      attachedImages: "Attached Images",
      recordingStatus: "Recording... Speak now",
      viewOnMaps: "View on Google Maps",
      helpText: {
        photos: "Photos help municipal staff understand and prioritize your report",
        location: "Accurate location helps staff respond quickly"
      },
      disclaimer: "Reports are reviewed within 2-3 business days. Emergency issues should be reported to 911.",
      messages: {
        photoCaptured: "Photo Captured",
        photoAddedToReport: "Photo has been added to your report.",
        filesUploaded: "Files Uploaded",
        filesAddedToReport: "file(s) added to your report.",
        voiceNotSupported: "Your browser doesn't support voice recording. Try Chrome, Edge, or Safari.",
        voiceRecordingStarted: "Voice Recording Started",
        speakNow: "Speak now to describe the issue...",
        locationNotSupported: "Your browser doesn't support location services.",
        fetchingLocation: "Fetching Location...",
        gettingCurrentLocation: "Getting your current location...",
        locationFound: "Location Found",
        locationAdded: "Your current location has been added.",
        gpsCoordinatesAdded: "GPS coordinates have been added.",
        authRequired: "Authentication Required",
        signInToSubmit: "Please sign in to submit a report.",
        missingInfo: "Missing Information",
        fillAllFields: "Please fill in all required fields.",
        reportSubmitted: "Your report has been submitted successfully. You'll receive updates via email.",
        submitFailed: "Failed to submit your report. Please try again.",
        tapToCapture: "Tap the camera button to capture"
      }
    },
    
    // Sign In Page
    signIn: {
      title: "Welcome Back!",
      subtitle: "Continue making your city better",
      email: "Email",
      emailPlaceholder: "Enter your email",
      password: "Password",
      passwordPlaceholder: "Enter your password",
      signInButton: "Sign In",
      signingIn: "Signing you in...",
      noAccount: "Don't have an account?",
      createOne: "Create one here",
      errors: {
        fillAllFields: "Please fill in all fields",
        invalidCredentials: "Invalid email or password. Please check your credentials and try again."
      }
    },
    
    // Sign Up Page
    signUp: {
      title: "Join Urban Guardians",
      subtitle: "Create your account and start making a difference in your community",
      linkText: "Sign up here",
      fullName: "Full Name",
      namePlaceholder: "Enter your full name",
      email: "Email",
      emailPlaceholder: "Enter your email",
      password: "Password",
      passwordPlaceholder: "Create a password (min 6 characters)",
      confirmPassword: "Confirm Password",
      confirmPlaceholder: "Confirm your password",
      signUpButton: "Create Account",
      creatingAccount: "Creating your account...",
      alreadyHaveAccount: "Already have an account?",
      signInLink: "Sign in instead",
      emailTaken: "This email is already registered.",
      emailAvailable: "Email available"
    },
    
    // Common/Toasts
    toasts: {
      success: "Success",
      error: "Error",
      warning: "Warning",
      info: "Info"
    },
    
    // Settings
    settings: {
      title: "Settings",
      subtitle: "Manage your account and preferences"
    },
    
    // Community Feed
    community: {
      title: "Community Reports",
      subtitle: "See what's happening in your area"
    },
    
    // My Reports
    myReports: {
      title: "My Reports",
      subtitle: "Track your submitted reports"
    },
    
    // Video Demo
    videoDemo: {
      watchDemo: "Watch Demo",
      title: "See How It Works",
      close: "Close"
    },
    
    // Footer
    footer: {
      about: "About",
      aboutTitle: "About Urban Guardians",
      aboutDescription: "Empowering communities to report and track civic issues for a better urban environment.",
      quickLinks: "Quick Links",
      contact: "Contact",
      contactInfo: {
        email: "Email: info@urbanguardians.com",
        phone: "Phone: (555) 123-4567"
      },
      followUs: "Follow Us",
      home: "Home",
      reports: "Reports",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      copyright: "© 2024 Urban Guardians. All rights reserved."
    },
    
    // Community Feed
    communityFeed: {
      title: "Community Issues",
      subtitle: "Browse and support civic issues reported by your community",
      searchPlaceholder: "Search issues or locations...",
      filterByStatus: "Filter by status",
      allStatus: "All Status",
      pending: "Pending",
      inProgress: "In Progress",
      resolved: "Resolved",
      listView: "List View",
      mapView: "Map View",
      support: "Support",
      supported: "Supported",
      comments: "Comments",
      noReportsYet: "No community reports yet. Be the first to report an issue!",
      noMatchingFilters: "No issues found matching your filters.",
      interactiveMap: "Interactive Map",
      mapDescription: "Map integration will show all reported issues with location pins",
      enableMapView: "Enable Map View",
      voteRemoved: "Vote removed",
      voteRemovedDesc: "Your support has been removed from this report.",
      thanksForSupport: "Thanks for your support!",
      votePrioritizes: "Your vote helps prioritize community issues.",
      failedToLoad: "Failed to load reports",
      unableToFetch: "Unable to fetch community reports. Please try again.",
      lessThanHour: "Less than an hour ago",
      hoursAgo: "hour(s) ago",
      daysAgo: "day(s) ago",
      weeksAgo: "week(s) ago"
    },
    
    // My Reports
    myReportsPage: {
      title: "My Reports",
      subtitle: "Track the status of your civic issue reports",
      signInRequired: "Sign In Required",
      signInMessage: "Please sign in to your account to view your civic issue reports.",
      totalReports: "Total Reports",
      resolved: "Resolved",
      inProgress: "In Progress",
      civicPoints: "Civic Points",
      noReportsTitle: "No Reports Yet",
      noReportsMessage: "You haven't submitted any reports yet. Start making a difference in your community!",
      createFirstReport: "Create Your First Report",
      viewDetails: "View Details",
      statusUpdate: "Status Update",
      reportProgress: "Report Progress",
      reportedOn: "Reported on",
      lastUpdated: "Last updated",
      priority: "Priority",
      high: "High",
      medium: "Medium",
      low: "Low",
      failedToLoad: "Failed to load reports",
      unableToFetch: "Unable to fetch your reports. Please try again."
    },
    
    // Settings Page
    settingsPage: {
      title: "Settings",
      subtitle: "Manage your account settings and preferences",
      backToHome: "Back to Home",
      saveChanges: "Save Changes",
      saving: "Saving...",
      saved: "Settings Saved",
      savedDesc: "Your preferences have been updated successfully.",
      tabs: {
        profile: "Profile",
        notifications: "Notifications",
        privacy: "Privacy",
        appearance: "Appearance",
        account: "Account"
      },
      profile: {
        title: "Profile Information",
        subtitle: "Update your personal information and public profile",
        fullName: "Full Name",
        email: "Email Address",
        phone: "Phone Number",
        location: "Location",
        bio: "Bio",
        profilePicture: "Profile Picture",
        upload: "Upload",
        remove: "Remove"
      },
      notifications: {
        title: "Notification Preferences",
        subtitle: "Choose how you want to be notified about updates",
        emailNotifications: "Email Notifications",
        pushNotifications: "Push Notifications",
        reportUpdates: "Report Updates",
        communityActivity: "Community Activity",
        newsletter: "Newsletter",
        mentions: "Mentions",
        sound: "Notification Sound"
      },
      privacy: {
        title: "Privacy & Security",
        subtitle: "Control your privacy settings and data sharing preferences",
        profileVisibility: "Profile Visibility",
        public: "Public - Anyone can see your profile",
        friends: "Friends Only - Only connections can see",
        private: "Private - Only you can see",
        showEmail: "Show Email Address",
        showLocation: "Show Location",
        activityStatus: "Activity Status",
        dataCollection: "Usage Analytics",
        dataManagement: "Data Management",
        exportData: "Export My Data",
        deleteData: "Request Data Deletion"
      },
      appearance: {
        title: "Appearance",
        subtitle: "Customize how the app looks and feels",
        theme: "Theme",
        light: "Light",
        dark: "Dark",
        system: "System",
        colorScheme: "Color Scheme",
        fontSize: "Font Size",
        small: "Small",
        medium: "Medium (Default)",
        large: "Large",
        compactMode: "Compact Mode",
        accessibility: "Accessibility",
        reduceMotion: "Reduce Motion",
        highContrast: "High Contrast",
        keyboardNav: "Keyboard Navigation"
      },
      account: {
        changePassword: "Change Password",
        currentPassword: "Current Password",
        newPassword: "New Password",
        confirmNewPassword: "Confirm New Password",
        updatePassword: "Update Password",
        sessionManagement: "Session Management",
        currentDevice: "Current Device",
        signOutAll: "Sign Out All Devices",
        dangerZone: "Danger Zone",
        deleteAccount: "Delete My Account",
        deleteWarning: "Deleting your account will permanently remove all your data, reports, and settings. This action cannot be undone."
      }
    },
    
    // Video Demo
    videoDemoComponent: {
      watchDemo: "Watch Demo",
      platformDemo: "Platform Demo",
      demoDescription: "Learn how to use Urban Guardians to report and track civic issues in your community.",
      close: "Close",
      adminPanel: "Admin Panel",
      updateVideo: "Update Video",
      videoUrl: "Video URL",
      videoTitle: "Video Title",
      videoDescription: "Video Description",
      uploadedBy: "Uploaded by",
      uploadedAt: "Uploaded at",
      urlRequired: "URL Required",
      enterValidUrl: "Please enter a valid video URL",
      videoUpdated: "Video Updated",
      videoUpdatedDesc: "Demo video has been successfully updated"
    }
  },
  
  hi: {
    // Navigation
    nav: {
      home: "होम",
      report: "समस्या रिपोर्ट करें",
      community: "समुदाय",
      myReports: "मेरी रिपोर्ट्स",
      settings: "सेटिंग्स",
      signIn: "साइन इन",
      signOut: "साइन आउट",
      profile: "प्रोफ़ाइल"
    },
    
    // Hero Section
    hero: {
      badge: "नगरपालिका सेवा मंच",
      title: {
        part1: "समस्याओं की रिपोर्ट करें,",
        part2: "समुदाय बनाएं"
      },
      subtitle: "स्थानीय समस्याओं की रिपोर्ट करके अपने शहर को बेहतर बनाने में मदद करें। गड्ढों से लेकर टूटी स्ट्रीट लाइटों तक, सभी के लिए बेहतर समुदाय बनाने में आपकी आवाज़ मायने रखती है।",
      reportButton: "समस्या रिपोर्ट करें",
      watchDemo: "डेमो देखें",
      stats: {
        issuesResolved: "हल की गई समस्याएं",
        activeCitizens: "सक्रिय नागरिक",
        responseRate: "प्रतिक्रिया दर",
        userRating: "उपयोगकर्ता रेटिंग"
      },
      floatingCards: {
        resolved: {
          title: "समस्या हल हुई!",
          subtitle: "मुख्य सड़क पर गड्ढा"
        },
        upvotes: {
          title: "+23 वोट",
          subtitle: "समुदाय समर्थन"
        }
      },
      howItWorks: {
        title: "यह कैसे काम करता है",
        subtitle: "सरल, प्रभावी और पारदर्शी। तीन आसान चरणों में समस्याओं की रिपोर्ट करें और अपने समुदाय में सुधार देखें।",
        step1: {
          title: "1. समस्या की रिपोर्ट करें",
          description: "फोटो लें, समस्या का वर्णन करें, और स्थान विवरण जोड़ें। हमारा फॉर्म इसे त्वरित और आसान बनाता है।"
        },
        step2: {
          title: "2. प्रगति ट्रैक करें",
          description: "अपनी रिपोर्ट की स्थिति की निगरानी करें और नगरपालिका टीमों द्वारा समस्या को हल करने के अपडेट प्राप्त करें।"
        },
        step3: {
          title: "3. समुदाय बनाएं",
          description: "नागरिक अंक अर्जित करें, दूसरों की रिपोर्ट का समर्थन करें, और अपने पड़ोस पर सकारात्मक प्रभाव देखें।"
        }
      }
    },
    
    // Report Form
    reportForm: {
      title: "नागरिक समस्या की रिपोर्ट करें",
      subtitle: "स्थानीय समस्याओं की रिपोर्ट करके अपने समुदाय को बेहतर बनाने में मदद करें",
      signInRequired: "साइन इन आवश्यक",
      signInMessage: "नागरिक समस्याओं की रिपोर्ट करने और अपने समुदाय को बेहतर बनाने में मदद करने के लिए कृपया अपने खाते में साइन इन करें।",
      fields: {
        title: "समस्या शीर्षक",
        category: "समस्या श्रेणी",
        photos: "फ़ोटो जोड़ें (वैकल्पिक)",
        description: "विवरण",
        location: "स्थान"
      },
      placeholders: {
        title: "समस्या का संक्षिप्त सारांश",
        category: "समस्या का प्रकार चुनें",
        description: "समस्या का विस्तार से वर्णन करें...",
        location: "पता या स्थान दर्ज करें"
      },
      buttons: {
        takePhoto: "फोटो लें",
        uploadFiles: "फाइलें अपलोड करें",
        submit: "रिपोर्ट जमा करें",
        submitting: "जमा कर रहे हैं...",
        voice: "आवाज़",
        stop: "रोकें"
      },
      categories: {
        roadMaintenance: "सड़क रखरखाव",
        wasteManagement: "अपशिष्ट प्रबंधन",
        waterUtilities: "जल और उपयोगिताएं",
        lighting: "स्ट्रीट लाइटिंग",
        vandalism: "तोड़फोड़",
        traffic: "यातायात और सिग्नल",
        infrastructure: "बुनियादी ढांचा",
        other: "अन्य"
      },
      attachedImages: "संलग्न चित्र",
      recordingStatus: "रिकॉर्डिंग... अब बोलें",
      viewOnMaps: "Google मैप्स पर देखें",
      helpText: {
        photos: "फ़ोटो नगरपालिका कर्मचारियों को आपकी रिपोर्ट को समझने और प्राथमिकता देने में मदद करती हैं",
        location: "सटीक स्थान कर्मचारियों को जल्दी प्रतिक्रिया देने में मदद करता है"
      },
      disclaimer: "रिपोर्ट की समीक्षा 2-3 व्यावसायिक दिनों के भीतर की जाती है। आपातकालीन मुद्दों की रिपोर्ट 911 को की जानी चाहिए।",
      messages: {
        photoCaptured: "फोटो कैप्चर किया गया",
        photoAddedToReport: "फोटो आपकी रिपोर्ट में जोड़ा गया है।",
        filesUploaded: "फाइलें अपलोड की गईं",
        filesAddedToReport: "फाइल(ें) आपकी रिपोर्ट में जोड़ी गईं।",
        voiceNotSupported: "आपका ब्राउज़र वॉयस रिकॉर्डिंग का समर्थन नहीं करता। Chrome, Edge, या Safari आज़माएं।",
        voiceRecordingStarted: "वॉयस रिकॉर्डिंग शुरू हुई",
        speakNow: "समस्या का वर्णन करने के लिए अब बोलें...",
        locationNotSupported: "आपका ब्राउज़र स्थान सेवाओं का समर्थन नहीं करता।",
        fetchingLocation: "स्थान प्राप्त कर रहे हैं...",
        gettingCurrentLocation: "आपका वर्तमान स्थान प्राप्त कर रहे हैं...",
        locationFound: "स्थान मिला",
        locationAdded: "आपका वर्तमान स्थान जोड़ा गया है।",
        gpsCoordinatesAdded: "GPS निर्देशांक जोड़े गए हैं।",
        authRequired: "प्रमाणीकरण आवश्यक",
        signInToSubmit: "रिपोर्ट जमा करने के लिए कृपया साइन इन करें।",
        missingInfo: "जानकारी गुम",
        fillAllFields: "कृपया सभी आवश्यक फ़ील्ड भरें।",
        reportSubmitted: "आपकी रिपोर्ट सफलतापूर्वक जमा की गई है। आपको ईमेल के माध्यम से अपडेट प्राप्त होंगे।",
        submitFailed: "आपकी रिपोर्ट जमा करने में विफल। कृपया पुनः प्रयास करें।",
        tapToCapture: "कैप्चर करने के लिए कैमरा बटन टैप करें"
      }
    },
    
    // Sign In Page
    signIn: {
      title: "वापस स्वागत है!",
      subtitle: "अपने शहर को बेहतर बनाना जारी रखें",
      email: "ईमेल",
      emailPlaceholder: "अपना ईमेल दर्ज करें",
      password: "पासवर्ड",
      passwordPlaceholder: "अपना पासवर्ड दर्ज करें",
      signInButton: "साइन इन करें",
      signingIn: "साइन इन कर रहे हैं...",
      noAccount: "खाता नहीं है?",
      createOne: "यहाँ बनाएं",
      errors: {
        fillAllFields: "कृपया सभी फ़ील्ड भरें",
        invalidCredentials: "अमान्य ईमेल या पासवर्ड। कृपया अपनी साख की जांच करें और पुनः प्रयास करें।"
      }
    },
    
    // Sign Up Page
    signUp: {
      title: "अर्बन गार्डियन्स से जुड़ें",
      subtitle: "अपना खाता बनाएं और अपने समुदाय में बदलाव लाना शुरू करें",
      linkText: "यहाँ साइन अप करें",
      fullName: "पूरा नाम",
      namePlaceholder: "अपना पूरा नाम दर्ज करें",
      email: "ईमेल",
      emailPlaceholder: "अपना ईमेल दर्ज करें",
      password: "पासवर्ड",
      passwordPlaceholder: "पासवर्ड बनाएं (न्यूनतम 6 अक्षर)",
      confirmPassword: "पासवर्ड की पुष्टि करें",
      confirmPlaceholder: "अपने पासवर्ड की पुष्टि करें",
      signUpButton: "खाता बनाएं",
      creatingAccount: "आपका खाता बना रहे हैं...",
      alreadyHaveAccount: "पहले से खाता है?",
      signInLink: "इसके बजाय साइन इन करें",
      emailTaken: "यह ईमेल पहले से पंजीकृत है।",
      emailAvailable: "ईमेल उपलब्ध है"
    },
    
    // Common/Toasts
    toasts: {
      success: "सफलता",
      error: "त्रुटि",
      warning: "चेतावनी",
      info: "जानकारी"
    },
    
    // Settings
    settings: {
      title: "सेटिंग्स",
      subtitle: "अपने खाते और प्राथमिकताओं को प्रबंधित करें"
    },
    
    // Community Feed
    community: {
      title: "समुदाय रिपोर्ट",
      subtitle: "देखें कि आपके क्षेत्र में क्या हो रहा है"
    },
    
    // My Reports
    myReports: {
      title: "मेरी रिपोर्ट्स",
      subtitle: "अपनी सबमिट की गई रिपोर्ट्स को ट्रैक करें"
    },
    
    // Video Demo
    videoDemo: {
      watchDemo: "डेमो देखें",
      title: "देखें यह कैसे काम करता है",
      close: "बंद करें"
    },
    
    // Footer
    footer: {
      about: "हमारे बारे में",
      aboutTitle: "अर्बन गार्डियन्स के बारे में",
      aboutDescription: "बेहतर शहरी वातावरण के लिए नागरिक मुद्दों की रिपोर्ट और ट्रैक करने के लिए समुदायों को सशक्त बनाना।",
      quickLinks: "त्वरित लिंक",
      contact: "संपर्क करें",
      contactInfo: {
        email: "ईमेल: info@urbanguardians.com",
        phone: "फोन: (555) 123-4567"
      },
      followUs: "हमें फॉलो करें",
      home: "होम",
      reports: "रिपोर्ट्स",
      privacy: "गोपनीयता नीति",
      terms: "सेवा की शर्तें",
      copyright: "© 2024 अर्बन गार्डियन्स। सभी अधिकार सुरक्षित।"
    },
    
    // Community Feed
    communityFeed: {
      title: "समुदाय समस्याएं",
      subtitle: "अपने समुदाय द्वारा रिपोर्ट की गई नागरिक समस्याओं को ब्राउज़ करें और समर्थन करें",
      searchPlaceholder: "समस्याओं या स्थानों को खोजें...",
      filterByStatus: "स्थिति के अनुसार फ़िल्टर करें",
      allStatus: "सभी स्थिति",
      pending: "लंबित",
      inProgress: "प्रगति में",
      resolved: "हल किया गया",
      listView: "सूची दृश्य",
      mapView: "मानचित्र दृश्य",
      support: "समर्थन",
      supported: "समर्थित",
      comments: "टिप्पणियाँ",
      noReportsYet: "अभी तक कोई समुदाय रिपोर्ट नहीं। किसी समस्या की रिपोर्ट करने वाले पहले व्यक्ति बनें!",
      noMatchingFilters: "आपके फ़िल्टर से मेल खाने वाली कोई समस्या नहीं मिली।",
      interactiveMap: "इंटरैक्टिव मानचित्र",
      mapDescription: "मानचित्र एकीकरण स्थान पिन के साथ सभी रिपोर्ट की गई समस्याओं को दिखाएगा",
      enableMapView: "मानचित्र दृश्य सक्षम करें",
      voteRemoved: "वोट हटाया गया",
      voteRemovedDesc: "इस रिपोर्ट से आपका समर्थन हटा दिया गया है।",
      thanksForSupport: "आपके समर्थन के लिए धन्यवाद!",
      votePrioritizes: "आपका वोट समुदाय के मुद्दों को प्राथमिकता देने में मदद करता है।",
      failedToLoad: "रिपोर्ट लोड करने में विफल",
      unableToFetch: "समुदाय रिपोर्ट प्राप्त करने में असमर्थ। कृपया पुनः प्रयास करें।",
      lessThanHour: "एक घंटे से कम पहले",
      hoursAgo: "घंटे पहले",
      daysAgo: "दिन पहले",
      weeksAgo: "सप्ताह पहले"
    },
    
    // My Reports
    myReportsPage: {
      title: "मेरी रिपोर्ट्स",
      subtitle: "अपनी नागरिक समस्या रिपोर्ट की स्थिति ट्रैक करें",
      signInRequired: "साइन इन आवश्यक",
      signInMessage: "अपनी नागरिक समस्या रिपोर्ट देखने के लिए कृपया अपने खाते में साइन इन करें।",
      totalReports: "कुल रिपोर्ट्स",
      resolved: "हल किया गया",
      inProgress: "प्रगति में",
      civicPoints: "नागरिक अंक",
      noReportsTitle: "अभी तक कोई रिपोर्ट नहीं",
      noReportsMessage: "आपने अभी तक कोई रिपोर्ट सबमिट नहीं की है। अपने समुदाय में बदलाव लाना शुरू करें!",
      createFirstReport: "अपनी पहली रिपोर्ट बनाएं",
      viewDetails: "विवरण देखें",
      statusUpdate: "स्थिति अपडेट",
      reportProgress: "रिपोर्ट प्रगति",
      reportedOn: "रिपोर्ट की तारीख",
      lastUpdated: "अंतिम अपडेट",
      priority: "प्राथमिकता",
      high: "उच्च",
      medium: "मध्यम",
      low: "कम",
      failedToLoad: "रिपोर्ट लोड करने में विफल",
      unableToFetch: "आपकी रिपोर्ट प्राप्त करने में असमर्थ। कृपया पुनः प्रयास करें।"
    },
    
    // Settings Page
    settingsPage: {
      title: "सेटिंग्स",
      subtitle: "अपने खाते की सेटिंग्स और प्राथमिकताओं को प्रबंधित करें",
      backToHome: "होम पर वापस जाएं",
      saveChanges: "परिवर्तन सहेजें",
      saving: "सहेज रहे हैं...",
      saved: "सेटिंग्स सहेजी गईं",
      savedDesc: "आपकी प्राथमिकताएं सफलतापूर्वक अपडेट की गई हैं।",
      tabs: {
        profile: "प्रोफ़ाइल",
        notifications: "सूचनाएं",
        privacy: "गोपनीयता",
        appearance: "दिखावट",
        account: "खाता"
      },
      profile: {
        title: "प्रोफ़ाइल जानकारी",
        subtitle: "अपनी व्यक्तिगत जानकारी और सार्वजनिक प्रोफ़ाइल अपडेट करें",
        fullName: "पूरा नाम",
        email: "ईमेल पता",
        phone: "फोन नंबर",
        location: "स्थान",
        bio: "बायो",
        profilePicture: "प्रोफ़ाइल तस्वीर",
        upload: "अपलोड",
        remove: "हटाएं"
      },
      notifications: {
        title: "सूचना प्राथमिकताएं",
        subtitle: "चुनें कि आप अपडेट के बारे में कैसे सूचित होना चाहते हैं",
        emailNotifications: "ईमेल सूचनाएं",
        pushNotifications: "पुश सूचनाएं",
        reportUpdates: "रिपोर्ट अपडेट",
        communityActivity: "समुदाय गतिविधि",
        newsletter: "न्यूज़लेटर",
        mentions: "उल्लेख",
        sound: "सूचना ध्वनि"
      },
      privacy: {
        title: "गोपनीयता और सुरक्षा",
        subtitle: "अपनी गोपनीयता सेटिंग्स और डेटा साझाकरण प्राथमिकताओं को नियंत्रित करें",
        profileVisibility: "प्रोफ़ाइल दृश्यता",
        public: "सार्वजनिक - कोई भी आपकी प्रोफ़ाइल देख सकता है",
        friends: "केवल मित्र - केवल कनेक्शन देख सकते हैं",
        private: "निजी - केवल आप देख सकते हैं",
        showEmail: "ईमेल पता दिखाएं",
        showLocation: "स्थान दिखाएं",
        activityStatus: "गतिविधि स्थिति",
        dataCollection: "उपयोग विश्लेषण",
        dataManagement: "डेटा प्रबंधन",
        exportData: "मेरा डेटा निर्यात करें",
        deleteData: "डेटा हटाने का अनुरोध"
      },
      appearance: {
        title: "दिखावट",
        subtitle: "ऐप की दिखावट और अनुभव को अनुकूलित करें",
        theme: "थीम",
        light: "लाइट",
        dark: "डार्क",
        system: "सिस्टम",
        colorScheme: "रंग योजना",
        fontSize: "फ़ॉन्ट आकार",
        small: "छोटा",
        medium: "मध्यम (डिफ़ॉल्ट)",
        large: "बड़ा",
        compactMode: "कॉम्पैक्ट मोड",
        accessibility: "एक्सेसिबिलिटी",
        reduceMotion: "गति कम करें",
        highContrast: "उच्च कंट्रास्ट",
        keyboardNav: "कीबोर्ड नेविगेशन"
      },
      account: {
        changePassword: "पासवर्ड बदलें",
        currentPassword: "वर्तमान पासवर्ड",
        newPassword: "नया पासवर्ड",
        confirmNewPassword: "नए पासवर्ड की पुष्टि करें",
        updatePassword: "पासवर्ड अपडेट करें",
        sessionManagement: "सत्र प्रबंधन",
        currentDevice: "वर्तमान डिवाइस",
        signOutAll: "सभी डिवाइसों से साइन आउट करें",
        dangerZone: "खतरा क्षेत्र",
        deleteAccount: "मेरा खाता हटाएं",
        deleteWarning: "अपना खाता हटाने से आपका सारा डेटा, रिपोर्ट और सेटिंग्स स्थायी रूप से हट जाएंगी। यह क्रिया पूर्ववत नहीं की जा सकती।"
      }
    },
    
    // Video Demo
    videoDemoComponent: {
      watchDemo: "डेमो देखें",
      platformDemo: "प्लेटफ़ॉर्म डेमो",
      demoDescription: "जानें कि अपने समुदाय में नागरिक मुद्दों की रिपोर्ट और ट्रैक करने के लिए अर्बन गार्डियन्स का उपयोग कैसे करें।",
      close: "बंद करें",
      adminPanel: "एडमिन पैनल",
      updateVideo: "वीडियो अपडेट करें",
      videoUrl: "वीडियो URL",
      videoTitle: "वीडियो शीर्षक",
      videoDescription: "वीडियो विवरण",
      uploadedBy: "द्वारा अपलोड किया गया",
      uploadedAt: "अपलोड की तारीख",
      urlRequired: "URL आवश्यक",
      enterValidUrl: "कृपया एक वैध वीडियो URL दर्ज करें",
      videoUpdated: "वीडियो अपडेट किया गया",
      videoUpdatedDesc: "डेमो वीडियो सफलतापूर्वक अपडेट किया गया है"
    }
  }
};

export type Language = keyof typeof translations;
export type TranslationKeys = typeof translations.en;