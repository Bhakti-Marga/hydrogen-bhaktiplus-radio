#!/bin/bash

# Start ngrok tunnel for local development
# Reads NGROK_DOMAIN from .env.local

set -a
source .env.local 2>/dev/null || true
set +a

if [ -z "$NGROK_DOMAIN" ]; then
    echo "❌ NGROK_DOMAIN not set in .env.local"
    echo ""
    echo "Add your ngrok domain to .env.local:"
    echo "  NGROK_DOMAIN=yourname.bhaktimarga.ngrok.dev"
    echo ""
    exit 1
fi

echo "🌐 Starting ngrok tunnel..."
echo "🔗 Domain: $NGROK_DOMAIN"
echo ""
echo "📝 Configure in Shopify Customer Account API:"
echo "   Callback URI: https://$NGROK_DOMAIN/en-us/account/authorize"
echo "   JavaScript origin: https://$NGROK_DOMAIN"
echo ""
echo "   Note: The callback uses your locale prefix (e.g., /en-us/)"
echo ""

PORT=${PORT:-3000}
ngrok http "$PORT" --domain="$NGROK_DOMAIN"
