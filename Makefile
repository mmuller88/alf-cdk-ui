.DEFAULT_GOAL := build

PACKAGE_NAME := $(shell node -p "require('./package.json').name")

check-env:
ifeq ($(PACKAGE_NAME),)
	$(error PACKAGE_NAME is empty)
endif
ifeq ($(PACKAGE_NAME),undefined)
	$(error PACKAGE_NAME is undefined)
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
	npm run dist:dev

.PHONY: buildprod
buildprod: build
	npm run dist:prod

.PHONY: distcdk
distcdk: build
	npm run dist:prod && npm run dist:dev

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
cdkdiff: distcdk
	cd cdk && cdk diff '$(PACKAGE_NAME)-${STAGE}' --profile damadden88 || true

.PHONY: cdkdeploy
cdkdeploy: distcdk
	cd cdk && cdk deploy '$(PACKAGE_NAME)-${STAGE}' --profile damadden88 --require-approval never

.PHONY: cdksynth
cdksynth: distcdk
	cd cdk && cdk synth '$(PACKAGE_NAME)-${STAGE}' --profile damadden88 && mv cdk.out ../cdk.out

.PHONY: cdkpipelinediff
cdkpipelinediff: check-env cdkclean cdkbuild
	cd cdk && cdk diff "$(PACKAGE_NAME)-pipeline-stack-build" --profile damadden88 && cp -r cdk.out ../cdk.out || true

.PHONY: cdkpipelinedeploy
cdkpipelinedeploy: check-env cdkclean cdkbuild
	cd cdk && cdk deploy "$(PACKAGE_NAME)-pipeline-stack-build" --profile damadden88 --require-approval never

.PHONY: bootstrap
bootstrap:
	cd cdk && cdk bootstrap --profile damadden88 --trust 981237193288 --force --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess aws://981237193288/us-east-1
	cd cdk && cdk bootstrap --profile damadden88 --trust 981237193288 --force --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess aws://981237193288/eu-central-1
