# Svelte Render Test

A simple test to check if rendered-html blocks work on load.

```svelte
<script>
  let count = 0;
</script>

<button on:click={() => count++}>Count: {count}</button>
```
````Side Effects
[
    ET.UnmanagedEffect(
        what='stdout',
        content='The answer is 42'
    )
]
````
````Result
1.2345
````
````Side Effects
[
    ET.UnmanagedEffect(
        what='stdout',
        content='The answer is 42'
    )
]
````
````Result
1.2345
````


End of test.
