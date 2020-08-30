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
	rm -rf ./cdk.out ./build ./package

.PHONY: build
build: clean
	npm run build

.PHONY: builddev
builddev: clean
	npm run build-dev

.PHONY: buildqa
buildqa: clean
	npm run build-qa

.PHONY: buildprod
buildprod: clean
	npm run build

.PHONY: test
test:
	echo "not implemented"

.PHONY: package
package:
	cd build && npm install --only=production

.PHONY: cdkclean
cdkclean:
	cd cdk && rm -rf ./cdk.out

.PHONY: cdkbuild
cdkbuild: cdkclean
	cd cdk && npm run build

.PHONY: cdkdiff
cdkdiff: cdkclean cdkbuild
	cdk diff || true

.PHONY: cdkdeploydev
cdkdeploydev: cdkclean cdkbuild builddev
	cd cdk && cdk diff '$(FUNCTION_NAME)-dev' --profile unimed-dev || true
	cd cdk && cdk deploy '$(FUNCTION_NAME)-dev' --profile unimed-dev --require-approval never

.PHONY: cdkdeployqa
cdkdeployqa: cdkclean cdkbuild buildqa
	cd cdk && cdk diff '$(FUNCTION_NAME)-qa' --profile unimed-qa || true
	cd cdk && cdk deploy '$(FUNCTION_NAME)-qa' --profile unimed-qa --require-approval never

.PHONY: cdkdeployprod
cdkdeployprod: cdkclean cdkbuild buildprod
	cd cdk && cdk diff '$(FUNCTION_NAME)-prod' --profile damadden88 || true
	cd cdk && cdk deploy '$(FUNCTION_NAME)-prod' --profile damadden88 --require-approval never

.PHONY: cdkpipelinediff
cdkpipelinediff: check-env cdkclean cdkbuild
	cdk diff "$(FUNCTION_NAME)-pipeline-stack-build" || true

.PHONY: cdkpipelinedeploy
cdkpipelinedeploy: check-env cdkclean cdkbuild
	cd cdk && cdk deploy "$(FUNCTION_NAME)-pipeline-stack-build" --profile unimed-build

.PHONY: reload-infra
reload-infra:
	rm -rf node_modules/infrastructure-aws && npm i

