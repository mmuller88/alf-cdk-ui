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
	rm -rf ./cdk.out ./cdk/cdk.out ./build ./package ./cdk/build ./dist-dev ./dist-prod

.PHONY: build
build: clean install
	npm run build

.PHONY: builddev
builddev: build
	mkdir dist-dev && cp -R build/* dist-dev && cp config-dev.js dist-dev/config.js

.PHONY: buildprod
buildprod: build
	mkdir dist-prod && cp -R build/* dist-prod && cp config-prod.js dist-prod/config.js

.PHONY: test
test:
	echo "not implemented"

.PHONY: package
package:
	cd build && npm install --only=production

.PHONY: cdkclean
cdkclean:
	rm -rf ./cdk.out && cd cdk && rm -rf ./cdk.out ./build

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
	cd cdk && cdk deploy '$(FUNCTION_NAME)-dev' --context @aws-cdk/core:newStyleStackSynthesis=1 --profile unimed-dev --require-approval never

.PHONY: cdkdeployprod
cdkdeployprod: cdkclean cdkbuild buildprod
	cd cdk && cdk deploy '$(FUNCTION_NAME)-prod' --context @aws-cdk/core:newStyleStackSynthesis=1 --profile damadden88 --require-approval never

.PHONY: cdksynthprod
cdksynthprod: cdkclean cdkbuild buildprod
	cd cdk && cdk synth '$(FUNCTION_NAME)-prod' --profile damadden88 && mv cdk.out ../cdk.out

.PHONY: cdkpipelinediff
cdkpipelinediff: check-env cdkclean cdkbuild
	cd cdk && cdk diff "$(FUNCTION_NAME)-pipeline-stack-build" --profile damadden88 && cp -r cdk.out ../cdk.out || true

.PHONY: cdkpipelinedeploy
cdkpipelinedeploy: check-env cdkclean cdkbuild
	cd cdk && cdk deploy "$(FUNCTION_NAME)-pipeline-stack-build" --profile damadden88 --require-approval never

.PHONY: bootstrap
bootstrap:
	cd cdk && cdk bootstrap --profile damadden88 --trust 981237193288 --force --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess aws://981237193288/us-east-1
	cd cdk && cdk bootstrap --profile damadden88 --trust 981237193288 --force --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess aws://981237193288/eu-central-1
