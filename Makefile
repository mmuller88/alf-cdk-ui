.DEFAULT_GOAL := build

FUNCTION_NAME := $(shell node -p "require('./package.json').name")

check-env:
ifeq ($(FUNCTION_NAME),)
	$(error FUNCTION_NAME is empty)
endif
ifeq ($(FUNCTION_NAME),undefined)
	$(error FUNCTION_NAME is undefined)
endif

.PHONY: prepare
prepare:
	echo "not implemented"

.PHONY: clean
clean:
	cd src/cdk && rm -rf ./cdk.out ./build ./package

.PHONY: install
install:
	npm install

.PHONY: build
build: clean install
	npm run build

.PHONY: builddev
builddev: clean install
	npm run build-dev

.PHONY: buildqa
buildqa: clean install
	npm run build-qa

.PHONY: buildprod
buildprod: clean install
	npm run build-prod

.PHONY: test
test:
	echo "not implemented"

.PHONY: package
package:
	cd build

.PHONY: cdkclean
cdkclean:
	cd src/cdk && rm -rf ./cdk.out

.PHONY: cdkbuild
cdkbuild: cdkclean install
	cd src/cdk && npm run build-cdk

.PHONY: cdkdiffdev
cdkdiffdev: cdkclean cdkbuild builddev
	cd src/cdk && cdk diff '$(FUNCTION_NAME)-dev' --profile unimed-dev || true

.PHONY: cdkdiffqa
cdkdiffqa: cdkclean cdkbuild buildqa
	cd src/cdk && cdk diff '$(FUNCTION_NAME)-qa' --profile unimed-qa || true

.PHONY: cdkdiffprod
cdkdiffprod: cdkclean cdkbuild buildprod
	cd src/cdk && cdk diff '$(FUNCTION_NAME)-prod' --profile unimed-prod || true

.PHONY: cdkdeploydev
cdkdeploydev: cdkclean cdkbuild builddev
	cd src/cdk && cdk diff '$(FUNCTION_NAME)-dev' --profile unimed-dev || true
	cd src/cdk && cdk deploy '$(FUNCTION_NAME)-dev' --profile unimed-dev --require-approval never

.PHONY: cdkdeployqa
cdkdeployqa: cdkclean cdkbuild buildqa
	cd src/cdk && cdk diff '$(FUNCTION_NAME)-qa' --profile unimed-qa || true
	cd src/cdk && cdk deploy '$(FUNCTION_NAME)-qa' --profile unimed-qa --require-approval never

.PHONY: cdkdeployprod
cdkdeployprod: cdkclean cdkbuild buildprod
	cd src/cdk && cdk diff '$(FUNCTION_NAME)-prod' --profile unimed-prod || true
	cd src/cdk && cdk deploy '$(FUNCTION_NAME)-prod' --profile unimed-prod --require-approval never

.PHONY: cdkpipelinediff
cdkpipelinediff: check-env cdkclean cdkbuild
	cd src/cdk && cdk diff "$(FUNCTION_NAME)-pipeline-stack-build" || true

.PHONY: cdkpipelinedeploy
cdkpipelinedeploy: check-env cdkclean cdkbuild
	cd src/cdk && cdk deploy "$(FUNCTION_NAME)-pipeline-stack-build" --profile unimed-build --require-approval never
