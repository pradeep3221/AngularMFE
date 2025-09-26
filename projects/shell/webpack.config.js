const ModuleFederationPlugin = require("@module-federation/enhanced/webpack");

module.exports = {
  mode: "development",
  plugins: [
    new ModuleFederationPlugin({
      name: "shell",
      remotes: {
        "mfe1": "mfe1@http://localhost:4201/remoteEntry.js",
        "mfe2": "mfe2@http://localhost:4202/remoteEntry.js",
      "mfe3": "mfe3@http://localhost:4203/remoteEntry.js",
      },
      shared: {
        "@angular/core": { singleton: true, strictVersion: true, requiredVersion: "auto" },
        "@angular/common": { singleton: true, strictVersion: true, requiredVersion: "auto" },
        "@angular/common/http": { singleton: true, strictVersion: true, requiredVersion: "auto" },
        "@angular/router": { singleton: true, strictVersion: true, requiredVersion: "auto" },
        "rxjs": { singleton: true, strictVersion: true, requiredVersion: "auto" },
      },
    }),
  ],
};
