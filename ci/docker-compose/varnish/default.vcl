vcl 4.0;

backend default {
  .host = "nginx:8080";
}

sub vcl_recv {
    # Happens before we check if we have this in cache already.
    #
    # Typically you clean up the request here, removing cookies you don't need,
    # rewriting the request, etc.
    if (req.url !~ "^/screenshot") {
        return (pass);
    }

    unset req.http.cookie;
}

sub vcl_backend_response {
    # Happens after we have read the response headers from the backend.
    #
    # Here you clean the response headers, removing silly Set-Cookie headers
    # and other mistakes your backend does.

  # the cache period is 120s
  if (beresp.ttl < 120s) {
      unset beresp.http.cookie;
      unset beresp.http.Set-Cookie;
      set beresp.ttl = 120s;
      unset beresp.http.Cache-Control;
  }
}