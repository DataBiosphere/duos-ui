import { AuthProvider } from "react-oidc-context";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { OidcBroker } from "./libs/auth/oidcBroker";
import { createRoot } from "react-dom/client";
import React from "react";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <BrowserRouter>
    <AuthProvider {...OidcBroker.getOidcUserManagerSettings()}>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
