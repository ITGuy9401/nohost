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

        console.log("Downloading zip file...");

        WebServer.download(file, function (err, path) {
            console.log("downloaded");
            if (err) {
                status.className = "alert alert-danger";
                status.innerHTML = "Error downloading zip file!";
                console.error("Error downloading zip file!", err);
                return;
            }

            status.innerHTML = "Extracting zip file...";
            WebServer.install(path, function (err) {
                if (err) {
                    status.className = "alert alert-danger";
                    status.innerHTML = "Error downloading zip file!";
                    console.error("Error downloading zip file!", err);
                    return;
                }
                window.location = '/#/';
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

        var path = document.location.hash.substring(1, document.location.hash.length);

        console.log(path);

        console.log(bootOption, option, value);

        // If the DOM isn't ready, wait for it so document.write works fully
        if (document.readyState !== 'complete') {
            addEventListener('DOMContentLoaded', boot, false);
            return;
        }

        WebServer.start();

        // Case 1: no boot option, show server UI
        if (!option && !path) {
            showUI();
            return;
        }

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

        if (option === 'path') {
            WebServer.serve(value);
            return;
        }

        option = bootOption.join("=");

        if (!document.location.pathname.startsWith("/index.html")) {
            option = document.location.pathname + document.location.search ? document.location.search : "";
        }

        if (option.startsWith("#")) option = option.substring(1, option.length);

        console.log(option);

        // Case 3: a path was given into the web root, try to serve it.
        // Strip any server added trailing slash (unless we have '/').
        var url = option === '/' ? option : option.replace(/\/$/, '');
        WebServer.serve(path);
    }

    boot();
});
