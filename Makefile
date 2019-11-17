SHELL=/bin/bash
nexe=./node_modules/.bin/nexe
app=src/app.js
project=cloudmd

define publish
	echo "bin/cloudmd-$(1).tar.gz bin/$(1)"
	mkdir -p bin/$(1)
	$(nexe) $(app) -n $(project) -t $(1) -o bin/$(1)/$(project)

	if [ "$(1)" = "linux-x64" ]; then\
		tar cfz bin/cloudmd-$(1).tar.gz bin/$(1);\
	else\
		zip bin/cloudmd-$(1) bin/$(1);\
	fi

	rm -rf bin/$(1)
endef

publish:
	mkdir -p bin
	$(call publish,linux-x64)
	$(call publish,windows-x64)
	$(call publish,macos-x64)

clean:
	rm -rf bin