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

## Outputs

### `tag`

The tag which was created.

### `bumped`

Boolean value if the version was bumped. This script will ignore commits from itself to not create an infinite loop.

## Example usage

```yaml
uses: gnome-trading-group/maven-bump-and-deploy-action@1.0
```

Not a very useful example... sorry. I'm lazy.
