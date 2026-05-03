#!/bin/bash
echo "Starting Sylvex Local Server..."
echo "Opening browser at http://localhost:8000"
# Try to open browser based on OS
if [[ "$OSTYPE" == "msys" ]]; then
    start http://localhost:8000
elif [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:8000
else
    xdg-open http://localhost:8000 2>/dev/null || echo "Please open http://localhost:8000 in your browser"
fi

python -m http.server 8000
