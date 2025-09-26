const ModuleFederationPlugin = require("@module-federation/enhanced/webpack");

module.exports = {
  mode: "development",
  plugins: [
    new ModuleFederationPlugin({
      name: "mfe2",
      filename: "remoteEntry.js",
      exposes: {
        "./UsersComponent": "./projects/mfe2-user-management/src/app/users/users.component.ts",
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
