# Dependency Overrides Documentation

## The Problem: Nested Dependencies ("The Russian Doll Effect") When running
`npm audit`, high-severity vulnerabilities in `sharp` and `postcss`. 

Even though I installed the latest versions of these packages at our project
root, `npm audit` continued to report errors. This is because **Next.js**
includes its own internal copies of these libraries (nested inside
`node_modules/next/node_modules/...`). 

A standard `npm install` only updates the "outer" layer; it does not reach into
the "inner" layers where Next.js keeps its specific versions. This is why a
simple update was not fixing our security report.

## Solution: `overrides` To fix this, we used the `overrides` field in
`package.json`. 

**What it does:**  `overrides` acts as a "global override" rule. It tells
`npm`: *"No matter what version any other package (like Next.js) asks for,
force it to use THIS specific version instead."*

**Why use it:**  This allows to inject the secure versions of `sharp` and
`postcss` directly into the internal folders of Next.js without waiting for a
new Next.js release.

## Maintenance: How to Cleanup These overrides are a **temporary bridge**. If
left forever, they may eventually cause "version mismatch" bugs when we update
Next.js in the future.

### When is it safe to remove them? You can attempt to remove the `overrides`
section and go back to standard installation when:

1.  **The Audit is Clean:** Run `npm audit`. If it no longer shows
    high-severity vulnerabilities for `sharp` or `postcss`, even *without* the
    overrides, the underlying packages have been updated officially.
2.  **Next.js Update:** A new version of `next` has been released that natively
    uses a secure version of `sharp` (check [Next.js
    Releases](https://github.com/vercel/next.js/releases)).

### The Cleanup Procedure: If you believe the overrides are no longer needed,
follow these steps to ensure nothing breaks:

1.  **Delete** the `overrides` block from `package.json`.
2.  **Delete** your `package-lock.json` and `node_modules` folder (to ensure a
    totally fresh state): ```bash rm -rf node_modules package-lock.json ```
3.  **Reinstall**: ```bash npm install ```
4.  **Verify Security**: Run `npm audit`. 
    *   If the vulnerabilities are **GONE**: The cleanup was successful! Keep
        them deleted.
    *   If the vulnerabilities **REAPPEAR**: The official packages haven't
        updated yet. **Put the `overrides` back immediately** to stay secure.
5.  **Verify Functionality**: Specifically test your image components
(`next/image`) to ensure `sharp` is still working correctly with your current
version of Next.js.
