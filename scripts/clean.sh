#!/usr/bin/env bash
set -euo pipefail

# # ==========================================================================
# # mise task clean — find & remove node_modules and dist from apps/packages
# # reports leftovers that weren't cleaned
# # ==========================================================================

cd "$(dirname "$0")/.."

scan_and_clean() {
    local name="$1"       # human-readable label (e.g. "node_modules")
    local dirname="$2"    # folder name to search (e.g. "node_modules")
    local extra="${3:-}"  # extra paths to check (space-separated, relative to root)

    echo "=== Scanning $name ==="

    FOUND=()
    for dir in apps packages; do
        while IFS= read -r d; do
            FOUND+=("$d")
        done < <(find "$dir" -maxdepth 2 -type d -name "$dirname" 2>/dev/null)
    done

    if [ -n "$extra" ]; then
        for d in $extra; do
            if [ -d "$d" ]; then
                FOUND+=("$d")
            fi
        done
    fi

    if [ ${#FOUND[@]} -eq 0 ]; then
        echo "No $name found."
        return
    fi

    echo "Found ${#FOUND[@]} $name:"
    for d in "${FOUND[@]}"; do
        echo "  $d"
    done

    echo ""
    echo "Removing all found $name..."
    for d in "${FOUND[@]}"; do
        rm -rf "$d"
    done

    LEFTOVERS=()
    for dir in apps packages; do
        while IFS= read -r d; do
            LEFTOVERS+=("$d")
        done < <(find "$dir" -maxdepth 2 -type d -name "$dirname" 2>/dev/null)
    done

    if [ -n "$extra" ]; then
        for d in $extra; do
            if [ -d "$d" ]; then
                LEFTOVERS+=("$d")
            fi
        done
    fi

    if [ ${#LEFTOVERS[@]} -eq 0 ]; then
        echo "All $name removed successfully."
    else
        echo "WARNING: ${#LEFTOVERS[@]} $name still remain:"
        for d in "${LEFTOVERS[@]}"; do
            echo "  $d"
        done
    fi
}

scan_and_clean "node_modules" "node_modules"
echo ""
scan_and_clean "dist folders" "dist" "dist"

echo ""
echo "Clean complete."