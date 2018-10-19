requirejs.config({
    baseUrl: 'src/',
    paths: {
        filer: '../lib/filer.min',
        async: '../lib/async',
        domparser: '../lib/domparser',
        xhr: '../shims/xmlhttprequest'
    }
});

requirejs(['filer', 'webserver', 'xhr'], function (Filer, WebServer) {
    var Path = Filer.Path;

    function install(file) {
        var status = document.getElementById('status');
        status.innerHTML = "Downloading zip file...";
        status.style.display = 'block';

        WebServer.download(file, function (err, path) {
            if (err) {
                status.className = "alert alert-danger";
                status.innerHTML = "Error downloading zip file!";
                return;
            }

            status.innerHTML = "Extracting zip file...";
            WebServer.install(path, function (err) {
                if (err) {
                    status.className = "alert alert-danger";
                    status.innerHTML = "Error downloading zip file!";
                    return;
                }
                window.location = '?/';
            });
        });
    }

    function installr(file) {
        fetch(file).then(r => {
            console.log(r);
            install("" + r.url);
        }).catch(e => {
            console.error("error fetching data", e);
            alert("error fetching data");
        })
    }

    function showUI() {
        var ui = document.getElementById('ui');
        ui.style.display = 'block';

        // Listen for user specified zip files to install
        var upload = document.getElementById('upload');
        upload.addEventListener('change', function () {
            var file = this.files[0];
            install(file);
        }, false);
    }

    /**
     * Boot options and Web Server paths are given using the query string.
     * Valid boot options include:
     *
     * ?install=path/to/disk/image.zip --> installs image.zip into web root
     * ?reset --> clears all files from web root
     * ?/path/to/file --> serves a path from the web root
     */
    function boot() {
        var bootOption = document.location.search.substring(1).split('=');
        var option = bootOption[0];
        var value = bootOption.splice(1, bootOption.length - 1).join("=");

        const appDir = "/nohost";

        console.log(document.location.pathname, bootOption, option, value);

        // If the DOM isn't ready, wait for it so document.write works fully
        if (document.readyState !== 'complete') {
            addEventListener('DOMContentLoaded', boot, false);
            return;
        }

        WebServer.start();

        // Case 1: no boot option, show server UI
        // if (!option) {
        //     showUI();
        //     return;
        // }

        // Case 2: boot command (i.e., doesn't start with a '/')
        if (option === 'reset') {
            WebServer.reset();
            showUI();
            return;
        }
        if (option === 'install') {
            install(value);
            return;
        }
        if (option === 'installr') {
            installr(value);
            return;
        }

        if (!option && (!window.location.pathname.startsWith("/index.html") && !window.location.pathname.startsWith(appDir + "/index.html"))) {
            let newurl = null;
            if (window.location.pathname.startsWith(appDir)) {
                newurl = window.location.protocol + "//" + window.location.host + "/" + appDir + "?" + window.location.pathname.substring(appDir.length, window.location.pathname.length) + ".html";
            } else {
                newurl = window.location.protocol + "//" + window.location.host + "/?" + window.location.pathname + ".html";
            }
            console.log("new url", newurl);
            window.location.href = newurl;
            return;
        }

        // Case 3: a path was given into the web root, try to serve it.
        // Strip any server added trailing slash (unless we have '/').
        var url = option === '/' ? option : option.replace(/\/$/, '');
        WebServer.serve(url);
    }

    boot();
});
