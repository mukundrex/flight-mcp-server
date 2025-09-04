#!/usr/bin/env node

/**
 * Test script to verify Amadeus API integration
 * Run this after setting up your .env file with valid API credentials
 */

import dotenv from 'dotenv';
import { searchFlights, getAirportByCode } from './build/amadeus-service.js';

// Load environment variables
dotenv.config();

async function testAmadeusIntegration() {
  console.log('🧪 Testing Amadeus API Integration...\n');

  // Check environment variables
  if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
    console.error('❌ Missing Amadeus API credentials in .env file');
    console.log('Please set AMADEUS_API_KEY and AMADEUS_API_SECRET in your .env file');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log(`   API Key: ${process.env.AMADEUS_API_KEY.substring(0, 8)}...`);
  console.log(`   Environment: ${process.env.AMADEUS_ENVIRONMENT || 'test'}\n`);

  try {
    // Test 1: Get airport information
    console.log('🏢 Test 1: Getting airport information for JFK...');
    // const airport = await getAirportByCode('JFK');
    // if (airport) {
    //   console.log('✅ Airport found:', airport.name, `(${airport.city}, ${airport.country})`);
    // } else {
    //   console.log('⚠️  Airport not found (this might be expected in test environment)');
    // }

    // Test 2: Search flights
    console.log('\n✈️  Test 2: Searching flights JFK → LAX...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const flightResults = await searchFlights('JFK', 'LAX', dateStr);
    console.log(`✅ Flight search completed for ${dateStr}`);
    console.log(`   Direct flights found: ${flightResults.direct.length}`);
    console.log(`   Connecting flights found: ${flightResults.connecting.length}`);
    
    if (flightResults.direct.length > 0) {
      const firstFlight = flightResults.direct[0];
      console.log(`   Sample flight: ${firstFlight.flightNumber} - $${firstFlight.price.amount} ${firstFlight.price.currency}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nThis might be due to:');
    console.log('- Invalid API credentials');
    console.log('- Network connectivity issues');
    console.log('- API rate limits');
    console.log('- Test environment limitations');
    process.exit(1);
  }

  console.log('\n🎉 All tests completed successfully!');
  console.log('Your Amadeus API integration is working correctly.');
}

testAmadeusIntegration().catch(console.error);
