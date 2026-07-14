{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    bun = {
      url = "github:Daste745/nix-bun";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs:
    let
      supportedSystems = [
        "x86_64-linux"
        "aarch64-darwin"
      ];
      eachSupportedSystem =
        f:
        inputs.nixpkgs.lib.genAttrs supportedSystems (
          system:
          f {
            pkgs = import inputs.nixpkgs { inherit system; };
            bun = inputs.bun.packages.${system};
          }
        );
    in
    {
      devShells = eachSupportedSystem (
        { pkgs, bun }:
        {
          default = pkgs.mkShell {
            packages = [
              bun."1.3.9"
              pkgs.prisma_6
              pkgs.prisma-engines_6
              pkgs.openssl
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
