{
  description = "homebase - a TUI-style browser startpage dashboard";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Runtime
            deno

            # Dev tools
            just          # Task runner (alternative to make)
            watchexec     # File watcher for dev reload

            # Optional: for markdown preview during dev
            glow
          ];

          shellHook = ''
            echo "🏠 homebase dev environment"
            echo "Deno version: $(deno --version | head -1)"
            echo ""
            echo "Commands:"
            echo "  deno task dev     - Start dev server with watch"
            echo "  deno task build   - Build for production"
            echo "  deno task compile - Compile to executable"
            echo ""
          '';

          # Deno cache in project-local directory
          DENO_DIR = ".deno";
        };
      }
    );
}
