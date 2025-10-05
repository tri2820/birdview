#!/usr/bin/env bash
SESSION="birdview"

# Kill old session if it exists
tmux kill-session -t $SESSION 2>/dev/null


tmux new-session -d -s $SESSION -n birdview
tmux send-keys -t $SESSION:birdview "birdview --config birdview.config.json" C-m


# Attach when ready
tmux attach -t $SESSION