USAGE
=====

```
docker-compose up
```

See the included `docker-compose.yml` for an example of
running the service with `nginx` rate-limiting and a
`varnish` caching proxy. Note that probably having
just `varnish` is enough.

## Endpoint /screenshot

### Parameters

* `url` - The url you want to screenshot. Default: https://example.com
* `viewportWidth` - The width of the viewport. Default: 1280
* `viewportHeight` - The height of the viewport. Default: 720
* `viewportScale` - The scale (pixel density) of the viewport. Default: 2
* `browser` - One of `chromium`, `webkit`, or `firefox`. Default: `chromium`
* `waitForContent` - A regular expression to use in testing page 
  content. The screenshot is taken AFTER the match 
  succeeds. Useful for dynamic content. There is a maximum wait time,
  after this is exceeded, the screenshot will be taken anyway.

## Examples

```shell
# A screenshot of https://example.org (the default) using chromium (the default browser)
curl -o example.png localhost:3000/screenshot

# A screenshot of https://google.com (use the url parameter)
curl -o example.png localhost:3000/screenshot?url=https%3A%2F%2Fgoogle.com

# A screenshot of https://example.org (the default) using webkit
curl -o example.png localhost:3000/screenshot?browser=webkit

# A screenshot of https://example.org (the default) using firefox
curl -o example.png localhost:3000/screenshot?browser=firefox

# A screenshot of https://example.org (the default) using firefox, altering the default viewport width and height
curl -o example.png localhost:3000/screenshot?browser=firefox&viewportWidth=2000&viewportHeight=720

# A screenshot of https://example.org (the default) using firefox, altering the default viewport scale (pixel density)
curl -o example.png localhost:3000/screenshot?browser=firefox&viewportWidth=2000&viewportScale=1

# A screenshot of https://example.org (the default), take the screenshot AFTER
# we detect content on the page using the passed regular expression
# in this case, we will take the screenshot after we have a successful match
# for page content matching regular expression "[dD]omain".
# This is useful for pages where the content is dynamic and needs some time to load.
curl -o example.png localhost:3000/screenshot?waitForContent=%5BdD%5Domain
```