CGO_FLAGS_AARCH64 := ""
CGO_FLAGS_AMD64 := "-m64"
CGO_FLAGS_ARM := ""
CGO_FLAGS_I686 := "-m32"
GCFLAGS := '-N -l'
GOPATH := `pwd`/../../../..
PACKAGE_BIN := config keys webroot `ls service*`

all: service

.PHONY: clean clean-all fmt keys test

clean:
	rm -rf dist/
	rm -f service

clean-all:
	rm -rf dist/
	rm -f service service-linux-aarch64 service-linux-amd64 service-linux-arm service-win-amd64.exe service-win-i686.exe

service:
	GOPATH=$(GOPATH) go build -o service -gcflags $(GCFLAGS)

service-linux-aarch64:
	GOPATH=$(GOPATH) CGO_ENABLED=1 CGO_CFLAGS=$(CGO_FLAGS_AARCH64) CC=aarch64-linux-gnu-gcc GOOS=linux GOARCH=arm64 go build -o service-linux-aarch64 -gcflags $(GCFLAGS)

service-linux-amd64:
	GOPATH=$(GOPATH) CGO_ENABLED=1 CGO_CFLAGS=$(CGO_FLAGS_AMD64) CC=x86_64-linux-gnu-gcc GOOS=linux GOARCH=amd64 go build -o service-linux-amd64 -gcflags $(GCFLAGS)

service-linux-arm:
	GOPATH=$(GOPATH) CGO_ENABLED=1 CGO_CFLAGS=$(CGO_FLAGS_ARM) CC=arm-linux-gnu-gcc GOOS=linux GOARCH=arm GOARM=7 go build -o service-linux-arm -gcflags $(GCFLAGS)

service-win-amd64.exe:
	GOPATH=$(GOPATH) CGO_ENABLED=1 CGO_CFLAGS=$(CGO_FLAGS_AMD64) CC=x86_64-w64-mingw32-gcc GOOS=windows GOARCH=amd64 go build -o service-win-amd64.exe -gcflags $(GCFLAGS)

service-win-i686.exe:
	GOPATH=$(GOPATH) CGO_ENABLED=1 CGO_CFLAGS=$(CGO_FLAGS_I686) CC=i686-w64-mingw32-gcc GOOS=windows GOARCH=386 go build -o service-win-i686.exe -gcflags $(GCFLAGS)

dist: service-linux-amd64 service-linux-arm service-win-amd64.exe
	mkdir dist
	mkdir dist/bin
	mkdir dist/bin/go-service
	cp -r $(PACKAGE_BIN) dist/bin/go-service/
	mkdir dist/src
	mkdir dist/src/go-service
	rsync -rlpv . dist/src/go-service/ --exclude dist/ --exclude ".*" --exclude "service*"
	cd dist/bin/ && tar cvzf go-service-bin.tar.gz --exclude=".[^/]*" go-service && cd ../../
	cd dist/src/ && tar cvzf go-service-src.tar.gz --exclude=".[^/]*" go-service && cd ../../

fmt:
	GOPATH=$(GOPATH) gofmt -w .

keys:
	openssl genrsa -out keys/private.pem 4096
	openssl req -new -x509 -days 365 -sha512 -key keys/private.pem -out keys/public.pem -subj "/C=DE/ST=Berlin/L=Berlin/O=None/OU=None/CN=localhost"

test:
	echo "There are no tests yet."
	#GOPATH=$(GOPATH) go test -cover github.com/andrepxx/go-service/...

