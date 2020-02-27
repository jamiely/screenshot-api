vcl 4.0;

backend default {
  .host = "nginx:8080";
}

sub vcl_recv {
    # Happens before we check if we have this in cache already.
    #
    # Typically you clean up the request here, removing cookies you don't need,
    # rewriting the request, etc.
    if (req.url == "/_varnish/healthz") {
        return (synth(204, "No Content"));
    }
    
    if (req.url !~ "^/screenshot") {
        return (pass);
    }
}
