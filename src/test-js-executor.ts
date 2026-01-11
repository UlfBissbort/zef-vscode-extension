// Standalone test for jsExecutor
// Run with: npx ts-node src/test-js-executor.ts

import { transformForReturn, executeJs, isBunAvailable } from './jsExecutor';

async function runTests() {
    console.log('=== JavaScript Executor Tests ===\n');
    
    // Check if bun is available
    const bunAvailable = await isBunAvailable();
    console.log(`Bun available: ${bunAvailable}`);
    if (!bunAvailable) {
        console.error('Bun not found! Install bun to run tests.');
        process.exit(1);
    }
    
    // Test 1: Transform function
    console.log('\n--- Test 1: Transform for Return ---');
    const transformCases = [
        { code: '5 + 3', expected: 'return 5 + 3' },
        { code: 'const x = 5;\nx * 2', expected: 'const x = 5;\nreturn x * 2' },
        { code: 'console.log("hi");\n42;', expected: 'console.log("hi");\nreturn 42' },
        { code: 'function foo() { return 1; }', expected: 'function foo() { return 1; }' },  // ends with }, no transform
    ];
    
    for (const tc of transformCases) {
        const result = transformForReturn(tc.code);
        const pass = result.trim() === tc.expected.trim();
        console.log(`${pass ? '✅' : '❌'} "${tc.code.replace(/\n/g, '\\n')}"`);
        if (!pass) {
            console.log(`   Expected: "${tc.expected.replace(/\n/g, '\\n')}"`);
            console.log(`   Got:      "${result.replace(/\n/g, '\\n')}"`);
        }
    }
    
    // Test 2: Simple expression
    console.log('\n--- Test 2: Simple Expression ---');
    const result2 = await executeJs('5 + 3', 'test-2');
    console.log(`Status: ${result2.status}`);
    console.log(`Result: ${result2.result}`);
    console.log(result2.result === '8' ? '✅ PASS' : '❌ FAIL');
    
    // Test 3: With console.log (side effects)
    console.log('\n--- Test 3: With console.log ---');
    const result3 = await executeJs('console.log("Hello from JS!");\n42', 'test-3');
    console.log(`Status: ${result3.status}`);
    console.log(`Result: ${result3.result}`);
    console.log(`Stdout: ${result3.stdout}`);
    console.log(result3.result === '42' && result3.stdout.includes('Hello') ? '✅ PASS' : '❌ FAIL');
    
    // Test 4: Object result
    console.log('\n--- Test 4: Object Result ---');
    const result4 = await executeJs('({ name: "test", value: 42 })', 'test-4');
    console.log(`Status: ${result4.status}`);
    console.log(`Result: ${result4.result}`);
    console.log(result4.result?.includes('name') && result4.result?.includes('test') ? '✅ PASS' : '❌ FAIL');
    
    // Test 5: Array result
    console.log('\n--- Test 5: Array Result ---');
    const result5 = await executeJs('[1, 2, 3].map(x => x * 2)', 'test-5');
    console.log(`Status: ${result5.status}`);
    console.log(`Result: ${result5.result}`);
    console.log(result5.result?.includes('[') && result5.result?.includes('6') ? '✅ PASS' : '❌ FAIL');
    
    // Test 6: Async code
    console.log('\n--- Test 6: Async Code ---');
    const result6 = await executeJs('await Promise.resolve(42)', 'test-6');
    console.log(`Status: ${result6.status}`);
    console.log(`Result: ${result6.result}`);
    console.log(result6.result === '42' ? '✅ PASS' : '❌ FAIL');
    
    // Test 7: Error handling
    console.log('\n--- Test 7: Error Handling ---');
    const result7 = await executeJs('throw new Error("Test error")', 'test-7');
    console.log(`Status: ${result7.status}`);
    console.log(`Error type: ${result7.error?.type}`);
    console.log(`Error message: ${result7.error?.message}`);
    // throw is a statement, so it runs as-is and throws the error
    console.log(result7.status === 'error' && result7.error?.message?.includes('Test error') ? '✅ PASS' : '❌ FAIL');
    
    // Test 8: Function definition and call
    console.log('\n--- Test 8: Function Definition ---');
    const result8 = await executeJs('function add(a, b) { return a + b; }\nadd(10, 20)', 'test-8');
    console.log(`Status: ${result8.status}`);
    console.log(`Result: ${result8.result}`);
    console.log(result8.result === '30' ? '✅ PASS' : '❌ FAIL');
    
    // Test 9: No expression (just statement)
    console.log('\n--- Test 9: Just Statement ---');
    const result9 = await executeJs('const x = 5;', 'test-9');
    console.log(`Status: ${result9.status}`);
    console.log(`Result: ${result9.result}`);
    // undefined is expected when there's no expression
    console.log(result9.status === 'ok' ? '✅ PASS' : '❌ FAIL');
    
    console.log('\n=== Tests Complete ===');
}

runTests().catch(console.error);
