const { ReactTypeScriptProject } = require('projen');

const dependencies = {
  // 'alf-cdk-app-pipeline': 'github:mmuller88/alf-cdk-app-pipeline#master',
  'aws-amplify': '^2.2.0',
  'aws-amplify-react': '^3.1.9',
  'connected-react-router': '^6.8.0',
  'env-cmd': '^10.1.0',
  'swagger-ui-react': '^3.28.0',
  'react-router': '^5.1.2',
  'react-router-dom': '^5.1.2',
  'react-custom-scrollbars': '^4.2.1',
  '@types/react-router-dom': '^5.1.5',
  '@types/swagger-ui-react': '^3.23.2',
  '@material-ui/core': '^4.11.0',
  '@material-ui/icons': '^4.9.1',
  '@material-ui/lab': '^4.0.0-alpha.56',
  '@material-ui/pickers': '^3.2.10',
  '@material-ui/styles': '^4.8.2',
  '@testing-library/jest-dom': '^4.2.4',
  '@testing-library/react': '^9.5.0',
  '@testing-library/user-event': '^7.2.1',
}

const name = 'alf-cdk-ui';

const project = new ReactTypeScriptProject({
  name: name,
  authorAddress: 'damadden88g@googlemail.com',
  authorName: 'Martin Müller',
  repository: `https://github.com/mmuller88/${name}`,
  dependencies,
  // peerDependencies: dependencies,
  keywords: [
    'cdk',
    'react-ts'
  ],
  releaseWorkflow: false,
});

const stage = '${STAGE:-dev}';
const prepareCdk = 'yarn run build && cd cdk && yarn install'

project.addScripts({
  'clean': 'rm -rf dist-dev dist-prod',
  // skip test in build: yarn run test
  'build': 'yarn run clean && yarn install && react-scripts build && yarn run dist:dev && yarn run dist:prod',
  'dist:dev': 'mkdir dist-dev && cp -R build/* dist-dev && cp config-dev.js dist-dev/config.js',
  'dist:prod': 'mkdir dist-prod && cp -R build/* dist-prod && cp config-prod.js dist-prod/config.js',
  'cdkdeploy': `cd cdk && yarn run cdkdeploy`,
  'cdksynth': `${prepareCdk} && cdk synth ${name}-${stage} --profile damadden88`,
  'cdkdestroy': `${prepareCdk} && yes | cdk destroy ${name}-${stage} --profile damadden88`,
  'cdkpipelinediff': `${prepareCdk} && cdk diff ${name}-pipeline --profile damadden88 || true`,
  'cdkpipelinedeploy': `${prepareCdk} && cdk deploy ${name}-pipeline --profile damadden88 --require-approval never`,
});

project.tsconfig.compilerOptions.rootDir=undefined;
// project.tsconfig.compilerOptions.outDir='build';
project.tsconfig.compilerOptions.noImplicitAny=undefined;
project.tsconfig.compilerOptions.noUnusedLocals=undefined;
project.tsconfig.compilerOptions.noUnusedParameters=undefined;
project.tsconfig.compilerOptions.strict=false;
project.tsconfig.compilerOptions.alwaysStrict=false;
project.tsconfig.compilerOptions.declaration=undefined;
project.tsconfig.compilerOptions.experimentalDecorators=undefined;
project.tsconfig.compilerOptions.stripInternal=undefined;
project.tsconfig.compilerOptions.strictPropertyInitialization=undefined;
project.tsconfig.compilerOptions.noImplicitThis=undefined;
project.tsconfig.compilerOptions.noImplicitReturns=undefined;
project.tsconfig.include=['**/src/**/*.tsx'];
project.tsconfig.exclude=['**/src/**/*.tsx'];
// project.tsconfig.compilerOptions.noFallthroughCasesInSwitch=undefined;
project.gitignore.exclude('cdk.out', 'dist-dev', 'dist-prod');

project.eslint=undefined
project.synth();
