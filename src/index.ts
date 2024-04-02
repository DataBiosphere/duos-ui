import "bootstrap/dist/css/bootstrap.min.css";

// jquery is needed for bootstrap
import "jquery/src/jquery";
import "bootstrap/dist/js/bootstrap.min";

import React from "react";
import "./index.css";
import { OidcBroker } from "./libs/auth/oidcBroker";
import { unregister } from "./registerServiceWorker";

const load = async () => {
    unregister();
    await OidcBroker.initializeAuth();

    window.location.pathname.startsWith("/redirect-from-oauth")
    ? import("./libs/auth/oauth-redirect-loader")
    : import("./appLoader");
}

load();

