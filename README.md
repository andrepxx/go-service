# go-service

This is a sample application, which demonstrates how to build a (secure) web service in Go.

The service can be queried over the URL `/cgi-bin/service`.

The action carried out by the service is selected by the `cgi` parameter. Each possible value results in a different handler function being called.

The only handler function implemented in this example performs a no-operation, then creates a *JSON* response indicating that the requested action was successful.

Static content from the `webroot/` subdirectory is served directly and unaltered.

MIME types are derived from the file extension, as configured in the server configuration located inside the `config/` directory.

