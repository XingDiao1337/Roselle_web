export interface UiContent {
  site: {
    brand: string;
    portalTitle: string;
    consoleTitle: string;
    clientSubtitle: string;
    description: string;
    footer: string;
    poweredBy: string;
    quotes: string[];
  };
  loading: {
    title: string;
    subtitle: string;
    errorTitle: string;
    retryBtn: string;
    offlineReason: string;
    timeoutReason: string;
  };
  auth: {
    welcomeTitle: string;
    welcomeSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    signInTab: string;
    signUpTab: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    signInBtn: string;
    signUpBtn: string;
    securityBadge: string;
  };
  profile: {
    downloadLoader: string;
    uploadAvatar: string;
    memberSince: string;
    subscriptionExpiry: string;
    activeSubscription: string;
    expiredSubscription: string;
    administrator: string;
    standardUser: string;
  };
  activation: {
    title: string;
    subtitle: string;
    description: string;
    inputLabel: string;
    inputPlaceholder: string;
    activateBtn: string;
    statusLabel: string;
  };
  hardware: {
    title: string;
    subtitle: string;
    description: string;
    statusLabel: string;
    boundStatus: string;
    unboundStatus: string;
    signatureLabel: string;
    clientAccessLabel: string;
    resetBtn: string;
  };
  password: {
    title: string;
    subtitle: string;
    description: string;
    currentLabel: string;
    newLabel: string;
    submitBtn: string;
  };
  releases: {
    injectorStatusTitle: string;
    injectorExeName: string;
    injectorDesc: string;
    downloadInjectorBtn: string;
    publishInjectorTitle: string;
    publishInjectorSubtitle: string;
    publishInjectorBtn: string;
    publishReleaseTitle: string;
    publishReleaseSubtitle: string;
    gameVersionLabel: string;
    releaseVersionLabel: string;
    dllFileLabel: string;
    publishReleaseBtn: string;
    recordsTitle: string;
  };
  admin: {
    usersTitle: string;
    generateCardsTitle: string;
    cardHistoryTitle: string;
  };
}

export const DEFAULT_CONTENT: UiContent = {
  site: {
    brand: "Roselle",
    portalTitle: "Roselle · Sovereign Platform",
    consoleTitle: "Roselle Console",
    clientSubtitle: "Pure Performance & Refined Aesthetics",
    description: "One account and injector for two distinct clients: Minecraft 26.2 and Forge 1.8.9. Choose the matching game version before injection; each version receives its own signed DLL release.",
    footer: "Roselle Cloud & Client Platform · Minecraft 26.2 + Forge 1.8.9",
    poweredBy: "Powered by Cloudflare",
    quotes: [
      "Red roses signify true, everlasting devotion and passion",
      "The thorn protects the petal; beauty fortified with security",
      "Blooms emerge with sovereign poise through the night",
      "A fragile silhouette guarding immutable cryptographic precision"
    ]
  },
  loading: {
    title: "Connecting to Roselle Cloud",
    subtitle: "Transferring container components & secure configuration from Cloudflare…",
    errorTitle: "界面获取失败",
    retryBtn: "重新获取界面",
    offlineReason: "本地网络断开 (Client Offline): 无法连接至互联网",
    timeoutReason: "Cloudflare 边缘节点传输超时 (Connection Timeout): 请检查网络代理或节点延迟"
  },
  auth: {
    welcomeTitle: "Welcome Back",
    welcomeSubtitle: "Sign in to access your cloud console",
    registerTitle: "Create Account",
    registerSubtitle: "Register your Roselle account",
    signInTab: "Sign In",
    signUpTab: "Sign Up",
    usernameLabel: "Username",
    usernamePlaceholder: "e.g. roselle_user",
    passwordLabel: "Password",
    passwordPlaceholder: "At least 8 characters",
    signInBtn: "Sign In to Account",
    signUpBtn: "Create Free Account",
    securityBadge: "AES-256 Encrypted Session · Standalone Injector Security"
  },
  profile: {
    downloadLoader: "Download Loader",
    uploadAvatar: "Upload",
    memberSince: "Member Since",
    subscriptionExpiry: "Subscription Expiry",
    activeSubscription: "Active Subscription",
    expiredSubscription: "Expired / Inactive",
    administrator: "Administrator",
    standardUser: "Member"
  },
  activation: {
    title: "License Activation",
    subtitle: "Cryptographic License & Subscription Container",
    description: "Enter your purchased license card key below. The cloud verifies and automatically extends your subscription.",
    inputLabel: "License Card Key",
    inputPlaceholder: "e.g. ROS-XXXX-XXXX",
    activateBtn: "Activate License Key",
    statusLabel: "Current License Status"
  },
  hardware: {
    title: "Hardware & Device Binding",
    subtitle: "Cryptographic Machine Identification",
    description: "Your account binds cryptographically to your Windows PC on client injection. If you switch computers, reset your hardware binding below.",
    statusLabel: "Binding Status",
    boundStatus: "Bound to Device",
    unboundStatus: "Unbound / Flexible",
    signatureLabel: "Hardware Signature",
    clientAccessLabel: "Client Access",
    resetBtn: "Reset Hardware Binding"
  },
  password: {
    title: "Security & Password",
    subtitle: "Update Account Credentials",
    description: "Updating your password immediately invalidates active web sessions for enhanced security. You will need to sign in again.",
    currentLabel: "Current Password",
    newLabel: "New Password",
    submitBtn: "Update Password"
  },
  releases: {
    injectorStatusTitle: "Native Injector Status",
    injectorExeName: "RoselleLoader.exe",
    injectorDesc: "The standalone Windows x64 client that authenticates hardware, checks cloud licenses, and injects Roselle.",
    downloadInjectorBtn: "Download Injector (.exe)",
    publishInjectorTitle: "Publish Injector",
    publishInjectorSubtitle: "Target x64 Executable",
    publishInjectorBtn: "Publish Injector",
    publishReleaseTitle: "Publish New Release",
    publishReleaseSubtitle: "Version-specific x64 DLL",
    gameVersionLabel: "Game Version",
    releaseVersionLabel: "Release Version",
    dllFileLabel: "DLL Binary File (.dll)",
    publishReleaseBtn: "Publish Release",
    recordsTitle: "Release Records"
  },
  admin: {
    usersTitle: "User Management",
    generateCardsTitle: "Generate Card Keys",
    cardHistoryTitle: "Card Key History"
  }
};

export async function fetchCloudContent(cloudBaseUrl: string): Promise<UiContent> {
  const base = cloudBaseUrl.replace(/\/+$/, '');
  const url = `${base}/content.json?_t=${Date.now()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Cloudflare edge returned status ${res.status}`);
    }
    const data = (await res.json()) as UiContent;
    return { ...DEFAULT_CONTENT, ...data };
  } finally {
    clearTimeout(timer);
  }
}
