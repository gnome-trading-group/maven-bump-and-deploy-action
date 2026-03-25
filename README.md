# Maven Bump and Deploy Action

This action will auto-bump-and-deploy on every commit to the repository. It will push major version changes if the commit messages starts with `major:` and minor if it starts with `feat:`. Otherwise, it will bump the path version.

It'll auto-deploy the new tag to whichever Maven repository is configured.

## Inputs

### `pom-file`

The location of the `pom.xml` file. Default `"pom.xml"`.

### `settings-file`

The location of the `settings.xml` file. Default `"settings.xml"`.

### `version-path`

The location of the `<version>` tag within `pom.xml`. Default `project/version`.

### `push-changes`

Boolean flag to push changes to git repo or not. Default `true`.

### `additional-args`

Additional arguments to pass into the `mvn` command. Default `""`.

## Outputs

### `tag`

The tag which was created.

### `bumped`

Boolean value if the version was bumped. This script will ignore commits from itself to not create an infinite loop.

## Releasing

To publish a new version of this action:

1. Build the bundle:
   ```sh
   npm run build
   ```

2. Commit the built `dist/index.js` (required — GitHub Actions reads it directly from the repo):
   ```sh
   git add dist/index.js
   git commit -m "build: bundle for release"
   ```

3. Tag and push:
   ```sh
   git tag v1.0.15
   git push origin master
   git push origin v1.0.15
   ```

## Example usage

```yaml
uses: gnome-trading-group/maven-bump-and-deploy-action@1.0
```

Not a very useful example... sorry. I'm lazy.
