#!/usr/bin/env node

/**
 * Test script to verify Shopify Storefront API connectivity
 * Reads credentials from .env file and makes a simple GraphQL query
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse .env file
function parseEnvFile() {
  const envPath = join(__dirname, '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=');
        // Remove quotes if present
        value = value.replace(/^["']|["']$/g, '');
        env[key.trim()] = value;
      }
    }
  });
  
  return env;
}

async function testShopifyConnection() {
  console.log('🔍 Testing Shopify Storefront API connection...\n');
  
  const env = parseEnvFile();
  
  const storeDomain = env.PUBLIC_STORE_DOMAIN?.replace(/^["']|["']$/g, '') || env.PUBLIC_STORE_DOMAIN;
  const storefrontToken = env.PUBLIC_STOREFRONT_API_TOKEN?.replace(/^["']|["']$/g, '') || env.PUBLIC_STOREFRONT_API_TOKEN;
  const storefrontId = env.PUBLIC_STOREFRONT_ID?.replace(/^["']|["']$/g, '') || env.PUBLIC_STOREFRONT_ID;
  
  // Check required variables
  if (!storeDomain) {
    console.error('❌ Error: PUBLIC_STORE_DOMAIN is not set in .env');
    process.exit(1);
  }
  
  if (!storefrontToken) {
    console.error('❌ Error: PUBLIC_STOREFRONT_API_TOKEN is not set in .env');
    process.exit(1);
  }
  
  console.log('📋 Configuration:');
  console.log(`   Store Domain: ${storeDomain}`);
  console.log(`   Storefront ID: ${storefrontId || 'not set'}`);
  console.log(`   Token: ${storefrontToken.substring(0, 10)}...${storefrontToken.substring(storefrontToken.length - 5)}\n`);
  
  // Build Shopify Storefront API URL
  const apiUrl = `https://${storeDomain}/api/2024-10/graphql.json`;
  
  // Simple GraphQL query to test connection
  const query = `
    query {
      shop {
        name
        primaryDomain {
          host
          url
        }
      }
    }
  `;
  
  console.log('🚀 Making test query to Shopify...\n');
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontToken,
      },
      body: JSON.stringify({ query }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      console.error('Response:', JSON.stringify(data, null, 2));
      process.exit(1);
    }
    
    if (data.errors) {
      console.error('❌ GraphQL Errors:');
      data.errors.forEach(error => {
        console.error(`   - ${error.message}`);
        if (error.extensions) {
          console.error(`     Extensions:`, JSON.stringify(error.extensions, null, 2));
        }
      });
      process.exit(1);
    }
    
    if (data.data && data.data.shop) {
      console.log('✅ Successfully connected to Shopify!');
      console.log('\n📦 Shop Information:');
      console.log(`   Name: ${data.data.shop.name}`);
      if (data.data.shop.primaryDomain) {
        console.log(`   Primary Domain: ${data.data.shop.primaryDomain.host}`);
        console.log(`   URL: ${data.data.shop.primaryDomain.url}`);
      }
      console.log('\n✨ Shopify connection is working correctly!');
      return true;
    } else {
      console.error('❌ Unexpected response format:', JSON.stringify(data, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Connection Error:');
    console.error(`   ${error.message}`);
    if (error.cause) {
      console.error(`   Cause: ${error.cause}`);
    }
    process.exit(1);
  }
}

testShopifyConnection().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

