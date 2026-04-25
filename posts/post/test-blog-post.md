# Markdown Showcase / Test File

---

## Headings

# H1
## H2
### H3
#### H4
##### H5
###### H6

---

## Text Formatting

**Bold**  
*Italic*  
***Bold + Italic***  
~~Strikethrough~~  
`Inline code`  

> Blockquote
>> Nested blockquote

---

## Links

[Normal Link](https://example.com)  
<https://example.com>  

---

## Images

![Alt Text](https://via.placeholder.com/150)

---

## Horizontal Rule

---

## Lists

### Unordered
- Item 1
- Item 2
  - Nested Item
    - Deep Nested

### Ordered
1. First
2. Second
   1. Nested
   2. Nested

### Task List
- [x] Done
- [ ] Not done

---

## Tables

| Name     | Type   | Value |
|----------|--------|-------|
| Example  | String | "Hi"  |
| Count    | Number | 42    |

---

## Code

### Inline
Here is some `inline_code()`.

### Code Block (Rust)

```rust
fn main() {
    println!("Hello, world!");
}
```

### Code Block (JSON)

```json
{
  "name": "markdown",
  "type": "test",
  "valid": true
}
```

---

## Collapsible Section

<details>
<summary>Click me to expand</summary>

### Inside Dropdown

- Works with lists
- And code

```rust
fn hidden() {
    println!("secret");
}
```

</details>

---

## HTML Support

<div style="padding:10px; border:1px solid gray;">
Custom HTML block
</div>

---

## Escaping Characters

\*Not italic\*  
\# Not a header  

---

## Footnotes

Here is a footnote reference[^1]

[^1]: This is the footnote.

---

## Definition List

Term 1  
: Definition 1  

Term 2  
: Definition 2  


---

## Math

Inline: $E = mc^2$

Block:
$$
\int_a^b f(x) dx
$$

---

## Mixed Content Stress Test

> **Bold quote with `code` and a [link](https://example.com)**  
> - List inside quote  
> - Another item  

---

## Edge Cases

- Empty list item:
-
- Weird spacing:

   Indented text

---

## Long Code Block (Rust)

```rust
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();

    map.insert("a", 1);
    map.insert("b", 2);

    for (key, value) in map {
        println!("{} -> {}", key, value);
    }
}
```

---

## If all of this rendered properly, the cool, I don't need to fix anything.