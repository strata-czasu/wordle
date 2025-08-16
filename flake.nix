{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs =
    {
      nixpkgs,
      ...
    }:
    let
      supportedSystems = [
        "x86_64-linux"
        "aarch64-darwin"
      ];
      eachSupportedSystem =
        f:
        nixpkgs.lib.genAttrs supportedSystems (
          system:
          f {
            inherit system;
            pkgs = import nixpkgs { inherit system; };
          }
        );
    in
    {
      devShells = eachSupportedSystem (
        { system, pkgs }:
        let
          bunVersion = "1.2.19";
          bunSources = {
            "aarch64-darwin" = pkgs.fetchurl {
              url = "https://github.com/oven-sh/bun/releases/download/bun-v${bunVersion}/bun-darwin-aarch64.zip";
              hash = "sha256-Z0pIN4NC76rcPCkVlrVzAQ88I4iVj3xEZ42H9vt1mZE=";
            };
            "x86_64-linux" = pkgs.fetchurl {
              url = "https://github.com/oven-sh/bun/releases/download/bun-v${bunVersion}/bun-linux-x64.zip";
              hash = "sha256-w9PBTppeyD/2fQrP525DFa0G2p809Z/HsTgTeCyvH2Y=";
            };
          };
          bun = pkgs.bun.overrideAttrs {
            version = bunVersion;
            src = bunSources.${system} or (throw "Unsupported system for bun: ${system}");
          };
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              bun
              prisma
              prisma-engines
              openssl
            ];
            shellHook = ''
              export LD_LIBRARY_PATH="${pkgs.stdenv.cc.cc.lib}/lib"
              export PKG_CONFIG_PATH="${pkgs.openssl.dev}/lib/pkgconfig";
              export PRISMA_SCHEMA_ENGINE_BINARY="${pkgs.prisma-engines}/bin/schema-engine"
              export PRISMA_QUERY_ENGINE_BINARY="${pkgs.prisma-engines}/bin/query-engine"
              export PRISMA_QUERY_ENGINE_LIBRARY="${pkgs.prisma-engines}/lib/libquery_engine.node"
              export PRISMA_FMT_BINARY="${pkgs.prisma-engines}/bin/prisma-fmt"
            '';
          };
        }
      );
    };
}
