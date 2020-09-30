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

.PHONY: install
install:
	npm install && cd cdk && npm install

.PHONY: clean
clean:
	rm -rf ./cdk.out ./build ./package ./cdk/build

.PHONY: build
build: clean install
	npm run build

.PHONY: builddev
builddev: clean install
	npm run build-dev

.PHONY: buildprod
buildprod: clean install
	npm run build

.PHONY: test
test:
	echo "not implemented"

.PHONY: package
package:
	cd build && npm install --only=production

.PHONY: cdkclean
cdkclean:
	cd cdk && rm -rf ./cdk.out ./build

.PHONY: cdkbuild
cdkbuild: cdkclean install
	cd cdk && npm run build

.PHONY: cdkdiff
cdkdiff: cdkclean cdkbuild
	cdk diff || true

.PHONY: cdkdiffdev
cdkdiffdev: cdkclean cdkbuild builddev
	cd cdk && cdk diff '$(FUNCTION_NAME)-dev' --profile unimed-dev || true

.PHONY: cdkdiffprod
cdkdiffprod: cdkclean cdkbuild buildprod
	cd cdk && cdk diff '$(FUNCTION_NAME)-prod' --profile damadden88 || true

.PHONY: cdkdeploydev
cdkdeploydev: cdkclean cdkbuild builddev
	cd cdk && cdk diff '$(FUNCTION_NAME)-dev' --profile unimed-dev || true
	cd cdk && cdk deploy '$(FUNCTION_NAME)-dev' --profile unimed-dev --require-approval never

.PHONY: cdkdeployprod
cdkdeployprod: cdkclean cdkbuild buildprod
	cd cdk && cdk diff '$(FUNCTION_NAME)-prod' --profile damadden88 || true
	cd cdk && cdk deploy '$(FUNCTION_NAME)-prod' --profile damadden88 --require-approval never

.PHONY: cdkpipelinediff
cdkpipelinediff: check-env cdkclean cdkbuild
	cdk diff "$(FUNCTION_NAME)-pipeline-stack-build" || true

.PHONY: cdkpipelinedeploy
cdkpipelinedeploy: check-env cdkclean cdkbuild
	cd cdk && cdk deploy "$(FUNCTION_NAME)-pipeline-stack-build" --profile damadden88 --require-approval never

.PHONY: reload-infra
reload-infra:
	rm -rf node_modules/infrastructure-aws && npm i

