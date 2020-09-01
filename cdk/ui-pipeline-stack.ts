import { Pipeline, Artifact } from '@aws-cdk/aws-codepipeline';
import { CodeBuildAction, GitHubSourceAction } from '@aws-cdk/aws-codepipeline-actions';
import { App, Stack, StackProps, SecretValue, Tags } from '@aws-cdk/core';
import { ServicePrincipal, Role, ManagedPolicy } from '@aws-cdk/aws-iam';
import { BuildEnvironmentVariableType, PipelineProject, BuildSpec, LinuxBuildImage } from '@aws-cdk/aws-codebuild';
// import { StringParameter } from '@aws-cdk/aws-ssm';
// import { prodAccount } from './app';

const prodAccount = {
  id: '981237193288',
  region: 'us-east-1',
  stage: 'prod',
  domainName: 'alfpro.net',
  subDomain: 'app',
  acmCertRef: 'arn:aws:acm:us-east-1:981237193288:certificate/62010fca-125e-4780-8d71-7d745ff91789',
  // subDomain: process.env.SUB_DOMAIN || 'app',
}

export interface UIPipelineStackProps extends StackProps {
  cdkVersion: string;
  // domainName: string;
  repositoryName: string;
  branch: string;
  runtime: {[k: string]: string | number};
}

// function createRoleProfile(account: AccountConfig) {
//   return [
//     `aws --profile unimed-${account.stage} configure set source_profile damadden88`,
//     `aws --profile unimed-${account.stage} configure set role_arn 'arn:aws:iam::${account.id}:role/unimed-${account.stage}'`,
//     `aws --profile unimed-${account.stage} configure set region ${AllowedRegions.euCentral1}`,
//   ];
// }

export class UIPipelineStack extends Stack {
  constructor(app: App, id: string, props: UIPipelineStackProps) {
    super(app, id, props);

    Tags.of(this).add('FrontendPipeline', this.stackName);

    const pipeline = new Pipeline(this, `${this.stackName}-pipeline`, {
      pipelineName: `${this.stackName}-pipeline`,
    });

    const cdkDeployRole = new Role(this, 'createInstanceBuildRole', {
      assumedBy: new ServicePrincipal('codebuild.amazonaws.com'),   // required
      managedPolicies: [
        // ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
        // ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        // ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationFullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'), // TODO find out the right permissions
      ],
    });

    const cdkBuild = new PipelineProject(this, `${this.stackName}-deployBuild`, {
      projectName: `${this.stackName}-deployBuild`,
      role: cdkDeployRole,
      environmentVariables: {
        deployerAccessKeyId: {
          value: 'deployer-access-key-id',
          type: BuildEnvironmentVariableType.PARAMETER_STORE,
        },
        deployerSecretAccessKey: {
          value: 'deployer-secret-access-key',
          type: BuildEnvironmentVariableType.PARAMETER_STORE,
        },
      },
      buildSpec: BuildSpec.fromObject({
        env: { 'git-credential-helper': 'yes' },
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': props.runtime,
            commands: [
              'aws --profile damadden88 configure set aws_access_key_id $deployerAccessKeyId',
              'aws --profile damadden88 configure set aws_secret_access_key $deployerSecretAccessKey',
              // @ts-ignore
              `aws --profile default configure set region ${props.env.region}`,
              // // @ts-ignore
              // ...createRoleProfile(devAccount),
              // // @ts-ignore
              // ...createRoleProfile(qaAccount),
              // // @ts-ignore
              // ...createRoleProfile(prodAccount),
              'npm install',
              'cd cdk && npm install && cd ..',
              `npm install -g aws-cdk@${props.cdkVersion}`,
            ],
          },
          build: {
            commands: [
              'npm run build',
              // 'cd build && npm install --only=production && cd ..',
              'ls -la',
              'echo "run: $CDK_COMMAND"',
              'eval $CDK_COMMAND',
            ],
          },
        },
        artifacts: {
          'base-directory': 'build',
          files: [
            '**/*',
          ],
        },
      }),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_4_0,
      },
    });

    const sourceOutput = new Artifact();
    const cdkBuildOutput = new Artifact(`${this.stackName}-cdk-build-output`);

    // const oauth = StringParameter.valueForSecureStringParameter(
    //   this, 'muller88-github-token', 1);
    const oauth = SecretValue.secretsManager('alfcdk', {
      jsonField: 'muller88-github-token',
    });

    const gitSource = new GitHubSourceAction({
      actionName: 'GithubSource',
      branch: props.branch,
      owner: 'mmuller88',
      repo: 'alf-cdk-ui',
      oauthToken: oauth,
      output: sourceOutput,
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        gitSource,
      ],
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new CodeBuildAction({
          actionName: 'CdkLintAndBuild',
          project: cdkBuild,
          input: sourceOutput,
          environmentVariables: {
            CDK_COMMAND: { value: 'make cdkbuild' },
          },
          outputs: [cdkBuildOutput],
        }),
      ],
    });

// todo: add devAccount later
    for (const account of [prodAccount]) {
      const deployStage = pipeline.addStage({
        stageName: `DeployStage${account.stage[0].toUpperCase()}${account.stage.slice(1)}`,
      });

      deployStage.addAction(new CodeBuildAction({
        input: sourceOutput,
        environmentVariables: {
          CDK_COMMAND: { value: `cd cdk && cdk diff '${this.stackName}-${account.stage}' --profile unimed-${account.stage} || true` },
        },
        project: cdkBuild,
        actionName: 'CreateDiff',
        runOrder: 1,
      }));

      // If not in dev stage, ask for approvement before deploying
      // if (account.id !== devAccount.id) {
      //   deployStage.addAction(new ManualApprovalAction({
      //     actionName: 'ApproveDiff',
      //     runOrder: 2,
      //   }));
      // }

      deployStage.addAction(new CodeBuildAction({
        input: sourceOutput,
        environmentVariables: {
          // CDK_COMMAND: { value: `cdk deploy '${this.stackName}-${account.stage}' --require-approval never --profile ${account.stage}` },
          CDK_COMMAND: { value: `make cdkdeploy${account.stage}` },
        },
        project: cdkBuild,
        actionName: 'DeployBuild',
        runOrder: 3,
      }));
    }
  }
}
