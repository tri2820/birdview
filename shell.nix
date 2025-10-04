# shell.nix
# This file defines a reproducible development and testing environment.
# To be run with `nix-shell --pure`

{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  # buildInputs is the list of software packages we need available in our environment.
  buildInputs = with pkgs; [
    nodejs_20  # Provides node, npm, and npx
    cacert     # Provides the SSL certificates needed for secure network access

    # Provides libatomic.so.1, which is a runtime dependency of the
    # pre-compiled binaries that ship with the node-av npm package.
    libgccjit
  ];

  # The shellHook is a block of shell script that runs automatically
  # every single time you enter this nix-shell.
  shellHook = ''
    # Create a temporary, writable directory for global npm packages for this session.
    export NPM_GLOBAL_DIR=$(mktemp -d)

    # Tell npm (via an environment variable) to use this directory as its "global" location.
    export npm_config_prefix=$NPM_GLOBAL_DIR

    # Add this new directory's bin folder to the PATH so we can run any installed commands.
    export PATH="$NPM_GLOBAL_DIR/bin:$PATH"

    # Tell the system's dynamic linker where to find the .so file for libgccjit.
    # We do NOT need the full ffmpeg package, only this library.
    export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath [ pkgs.libgccjit ]}"

    # Add a friendly message so the user knows the environment is ready.
    echo ""
    echo "✅ Test environment is ready."
    echo "   NPM global packages will be installed in a temporary directory: $NPM_GLOBAL_DIR"
    echo "   Runtime library path has been configured for missing dependencies."
    echo ""
  '';
}