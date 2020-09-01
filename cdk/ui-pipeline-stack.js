"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIPipelineStack = void 0;
const aws_codepipeline_1 = require("@aws-cdk/aws-codepipeline");
const aws_codepipeline_actions_1 = require("@aws-cdk/aws-codepipeline-actions");
const core_1 = require("@aws-cdk/core");
const aws_iam_1 = require("@aws-cdk/aws-iam");
const aws_codebuild_1 = require("@aws-cdk/aws-codebuild");
// import { StringParameter } from '@aws-cdk/aws-ssm';
// import { prodAccount } from './app';
const prodAccount = {
    id: '981237193288',
    region: 'us-east-1',
    stage: 'prod',
    domainName: 'alfpro.net',
    subDomain: 'app',
    acmCertRef: 'arn:aws:acm:us-east-1:981237193288:certificate/62010fca-125e-4780-8d71-7d745ff91789',
};
// function createRoleProfile(account: AccountConfig) {
//   return [
//     `aws --profile unimed-${account.stage} configure set source_profile damadden88`,
//     `aws --profile unimed-${account.stage} configure set role_arn 'arn:aws:iam::${account.id}:role/unimed-${account.stage}'`,
//     `aws --profile unimed-${account.stage} configure set region ${AllowedRegions.euCentral1}`,
//   ];
// }
class UIPipelineStack extends core_1.Stack {
    constructor(app, id, props) {
        super(app, id, props);
        core_1.Tags.of(this).add('FrontendPipeline', this.stackName);
        const pipeline = new aws_codepipeline_1.Pipeline(this, `${this.stackName}-pipeline`, {
            pipelineName: `${this.stackName}-pipeline`,
        });
        const cdkDeployRole = new aws_iam_1.Role(this, 'createInstanceBuildRole', {
            assumedBy: new aws_iam_1.ServicePrincipal('codebuild.amazonaws.com'),
            managedPolicies: [
                // ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
                // ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
                // ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationFullAccess'),
                aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
            ],
        });
        const cdkBuild = new aws_codebuild_1.PipelineProject(this, `${this.stackName}-build`, {
            projectName: `${this.stackName}-build`,
            role: cdkDeployRole,
            buildSpec: aws_codebuild_1.BuildSpec.fromObject({
                env: { 'git-credential-helper': 'yes' },
                version: '0.2',
                phases: {
                    install: {
                        'runtime-versions': props.runtime,
                        commands: ['npm install',
                            `npm install -g aws-cdk@${props.cdkVersion}`,
                        ],
                    },
                    build: {
                        commands: [
                            'npm run build',
                            'ls -la',
                        ],
                    },
                    post_build: {
                        commands: [
                        // 'npm run test',
                        ],
                    },
                },
            }),
            environment: {
                buildImage: aws_codebuild_1.LinuxBuildImage.STANDARD_4_0,
            },
        });
        const cdkDeployBuild = new aws_codebuild_1.PipelineProject(this, `${this.stackName}-deployBuild`, {
            projectName: `${this.stackName}-deployBuild`,
            role: cdkDeployRole,
            environmentVariables: {
                deployerAccessKeyId: {
                    value: 'deployer-access-key-id',
                    type: aws_codebuild_1.BuildEnvironmentVariableType.PARAMETER_STORE,
                },
                deployerSecretAccessKey: {
                    value: 'deployer-secret-access-key',
                    type: aws_codebuild_1.BuildEnvironmentVariableType.PARAMETER_STORE,
                },
            },
            buildSpec: aws_codebuild_1.BuildSpec.fromObject({
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
                buildImage: aws_codebuild_1.LinuxBuildImage.STANDARD_4_0,
            },
        });
        const sourceOutput = new aws_codepipeline_1.Artifact();
        const cdkBuildOutput = new aws_codepipeline_1.Artifact(`${this.stackName}-cdk-build-output`);
        // const oauth = StringParameter.valueForSecureStringParameter(
        //   this, 'muller88-github-token', 1);
        const oauth = core_1.SecretValue.secretsManager('alfcdk', {
            jsonField: 'muller88-github-token',
        });
        const gitSource = new aws_codepipeline_actions_1.GitHubSourceAction({
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
                new aws_codepipeline_actions_1.CodeBuildAction({
                    actionName: 'CdkLintAndBuild',
                    project: cdkBuild,
                    input: sourceOutput,
                    outputs: [cdkBuildOutput],
                }),
            ],
        });
        // todo: add devAccount later
        for (const account of [prodAccount]) {
            const deployStage = pipeline.addStage({
                stageName: `DeployStage${account.stage[0].toUpperCase()}${account.stage.slice(1)}`,
            });
            deployStage.addAction(new aws_codepipeline_actions_1.CodeBuildAction({
                input: sourceOutput,
                environmentVariables: {
                    CDK_COMMAND: { value: `cd cdk && cdk diff '${this.stackName}-${account.stage}' --profile unimed-${account.stage} || true` },
                },
                project: cdkDeployBuild,
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
            deployStage.addAction(new aws_codepipeline_actions_1.CodeBuildAction({
                input: sourceOutput,
                environmentVariables: {
                    // CDK_COMMAND: { value: `cdk deploy '${this.stackName}-${account.stage}' --require-approval never --profile ${account.stage}` },
                    CDK_COMMAND: { value: `make cdkdeploy${account.stage}` },
                },
                project: cdkDeployBuild,
                actionName: 'DeployBuild',
                runOrder: 3,
            }));
        }
    }
}
exports.UIPipelineStack = UIPipelineStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktcGlwZWxpbmUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1aS1waXBlbGluZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxnRUFBK0Q7QUFDL0QsZ0ZBQXdGO0FBQ3hGLHdDQUEwRTtBQUMxRSw4Q0FBeUU7QUFDekUsMERBQW1IO0FBQ25ILHNEQUFzRDtBQUN0RCx1Q0FBdUM7QUFFdkMsTUFBTSxXQUFXLEdBQUc7SUFDbEIsRUFBRSxFQUFFLGNBQWM7SUFDbEIsTUFBTSxFQUFFLFdBQVc7SUFDbkIsS0FBSyxFQUFFLE1BQU07SUFDYixVQUFVLEVBQUUsWUFBWTtJQUN4QixTQUFTLEVBQUUsS0FBSztJQUNoQixVQUFVLEVBQUUscUZBQXFGO0NBRWxHLENBQUE7QUFVRCx1REFBdUQ7QUFDdkQsYUFBYTtBQUNiLHVGQUF1RjtBQUN2RixnSUFBZ0k7QUFDaEksaUdBQWlHO0FBQ2pHLE9BQU87QUFDUCxJQUFJO0FBRUosTUFBYSxlQUFnQixTQUFRLFlBQUs7SUFDeEMsWUFBWSxHQUFRLEVBQUUsRUFBVSxFQUFFLEtBQTJCO1FBQzNELEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXRCLFdBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUV0RCxNQUFNLFFBQVEsR0FBRyxJQUFJLDJCQUFRLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLFNBQVMsV0FBVyxFQUFFO1lBQ2hFLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLFdBQVc7U0FDM0MsQ0FBQyxDQUFDO1FBRUgsTUFBTSxhQUFhLEdBQUcsSUFBSSxjQUFJLENBQUMsSUFBSSxFQUFFLHlCQUF5QixFQUFFO1lBQzlELFNBQVMsRUFBRSxJQUFJLDBCQUFnQixDQUFDLHlCQUF5QixDQUFDO1lBQzFELGVBQWUs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Q0FBQyxJQUFJLDBDQUFlLENBQUM7Z0JBQ3hDLEtBQUssRUFBRSxZQUFZO2dCQUNuQixvQkFBb0IsRUFBRTtvQkFDcEIsV0FBVyxFQUFFLEVBQUUsS0FBSyxFQUFFLHVCQUF1QixJQUFJLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQyxLQUFLLHNCQUFzQixPQUFPLENBQUMsS0FBSyxVQUFVLEVBQUU7aUJBQzVIO2dCQUNELE9BQU8sRUFBRSxjQUFjO2dCQUN2QixVQUFVLEVBQUUsWUFBWTtnQkFDeEIsUUFBUSxFQUFFLENBQUM7YUFDWixDQUFDLENBQUMsQ0FBQztZQUVKLDREQUE0RDtZQUM1RCxzQ0FBc0M7WUFDdEMscURBQXFEO1lBQ3JELGlDQUFpQztZQUNqQyxtQkFBbUI7WUFDbkIsU0FBUztZQUNULElBQUk7WUFFSixXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksMENBQWUsQ0FBQztnQkFDeEMsS0FBSyxFQUFFLFlBQVk7Z0JBQ25CLG9CQUFvQixFQUFFO29CQUNwQixpSUFBaUk7b0JBQ2pJLFdBQVcsRUFBRSxFQUFFLEtBQUssRUFBRSxpQkFBaUIsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFO2lCQUN6RDtnQkFDRCxPQUFPLEVBQUUsY0FBYztnQkFDdkIsVUFBVSxFQUFFLGFBQWE7Z0JBQ3pCLFFBQVEsRUFBRSxDQUFDO2FBQ1osQ0FBQyxDQUFDLENBQUM7U0FDTDtJQUNILENBQUM7Q0FDRjtBQTlMRCwwQ0E4TEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQaXBlbGluZSwgQXJ0aWZhY3QgfSBmcm9tICdAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lJztcbmltcG9ydCB7IENvZGVCdWlsZEFjdGlvbiwgR2l0SHViU291cmNlQWN0aW9uIH0gZnJvbSAnQGF3cy1jZGsvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zJztcbmltcG9ydCB7IEFwcCwgU3RhY2ssIFN0YWNrUHJvcHMsIFNlY3JldFZhbHVlLCBUYWdzIH0gZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgeyBTZXJ2aWNlUHJpbmNpcGFsLCBSb2xlLCBNYW5hZ2VkUG9saWN5IH0gZnJvbSAnQGF3cy1jZGsvYXdzLWlhbSc7XG5pbXBvcnQgeyBCdWlsZEVudmlyb25tZW50VmFyaWFibGVUeXBlLCBQaXBlbGluZVByb2plY3QsIEJ1aWxkU3BlYywgTGludXhCdWlsZEltYWdlIH0gZnJvbSAnQGF3cy1jZGsvYXdzLWNvZGVidWlsZCc7XG4vLyBpbXBvcnQgeyBTdHJpbmdQYXJhbWV0ZXIgfSBmcm9tICdAYXdzLWNkay9hd3Mtc3NtJztcbi8vIGltcG9ydCB7IHByb2RBY2NvdW50IH0gZnJvbSAnLi9hcHAnO1xuXG5jb25zdCBwcm9kQWNjb3VudCA9IHtcbiAgaWQ6ICc5ODEyMzcxOTMyODgnLFxuICByZWdpb246ICd1cy1lYXN0LTEnLFxuICBzdGFnZTogJ3Byb2QnLFxuICBkb21haW5OYW1lOiAnYWxmcHJvLm5ldCcsXG4gIHN1YkRvbWFpbjogJ2FwcCcsXG4gIGFjbUNlcnRSZWY6ICdhcm46YXdzOmFjbTp1cy1lYXN0LTE6OTgxMjM3MTkzMjg4OmNlcnRpZmljYXRlLzYyMDEwZmNhLTEyNWUtNDc4MC04ZDcxLTdkNzQ1ZmY5MTc4OScsXG4gIC8vIHN1YkRvbWFpbjogcHJvY2Vzcy5lbnYuU1VCX0RPTUFJTiB8fCAnYXBwJyxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBVSVBpcGVsaW5lU3RhY2tQcm9wcyBleHRlbmRzIFN0YWNrUHJvcHMge1xuICBjZGtWZXJzaW9uOiBzdHJpbmc7XG4gIC8vIGRvbWFpbk5hbWU6IHN0cmluZztcbiAgcmVwb3NpdG9yeU5hbWU6IHN0cmluZztcbiAgYnJhbmNoOiBzdHJpbmc7XG4gIHJ1bnRpbWU6IHtbazogc3RyaW5nXTogc3RyaW5nIHwgbnVtYmVyfTtcbn1cblxuLy8gZnVuY3Rpb24gY3JlYXRlUm9sZVByb2ZpbGUoYWNjb3VudDogQWNjb3VudENvbmZpZykge1xuLy8gICByZXR1cm4gW1xuLy8gICAgIGBhd3MgLS1wcm9maWxlIHVuaW1lZC0ke2FjY291bnQuc3RhZ2V9IGNvbmZpZ3VyZSBzZXQgc291cmNlX3Byb2ZpbGUgZGFtYWRkZW44OGAsXG4vLyAgICAgYGF3cyAtLXByb2ZpbGUgdW5pbWVkLSR7YWNjb3VudC5zdGFnZX0gY29uZmlndXJlIHNldCByb2xlX2FybiAnYXJuOmF3czppYW06OiR7YWNjb3VudC5pZH06cm9sZS91bmltZWQtJHthY2NvdW50LnN0YWdlfSdgLFxuLy8gICAgIGBhd3MgLS1wcm9maWxlIHVuaW1lZC0ke2FjY291bnQuc3RhZ2V9IGNvbmZpZ3VyZSBzZXQgcmVnaW9uICR7QWxsb3dlZFJlZ2lvbnMuZXVDZW50cmFsMX1gLFxuLy8gICBdO1xuLy8gfVxuXG5leHBvcnQgY2xhc3MgVUlQaXBlbGluZVN0YWNrIGV4dGVuZHMgU3RhY2sge1xuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgaWQ6IHN0cmluZywgcHJvcHM6IFVJUGlwZWxpbmVTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoYXBwLCBpZCwgcHJvcHMpO1xuXG4gICAgVGFncy5vZih0aGlzKS5hZGQoJ0Zyb250ZW5kUGlwZWxpbmUnLCB0aGlzLnN0YWNrTmFtZSk7XG5cbiAgICBjb25zdCBwaXBlbGluZSA9IG5ldyBQaXBlbGluZSh0aGlzLCBgJHt0aGlzLnN0YWNrTmFtZX0tcGlwZWxpbmVgLCB7XG4gICAgICBwaXBlbGluZU5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1waXBlbGluZWAsXG4gICAgfSk7XG5cbiAgICBjb25zdCBjZGtEZXBsb3lSb2xlID0gbmV3IFJvbGUodGhpcywgJ2NyZWF0ZUluc3RhbmNlQnVpbGRSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgU2VydmljZVByaW5jaXBhbCgnY29kZWJ1aWxkLmFtYXpvbmF3cy5jb20nKSwgICAvLyByZXF1aXJlZFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIC8vIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdDbG91ZFdhdGNoTG9nc0Z1bGxBY2Nlc3MnKSxcbiAgICAgICAgLy8gTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvblMzRnVsbEFjY2VzcycpLFxuICAgICAgICAvLyBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQVdTQ2xvdWRGb3JtYXRpb25GdWxsQWNjZXNzJyksXG4gICAgICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBZG1pbmlzdHJhdG9yQWNjZXNzJyksIC8vIFRPRE8gZmluZCBvdXQgdGhlIHJpZ2h0IHBlcm1pc3Npb25zXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY2RrQnVpbGQgPSBuZXcgUGlwZWxpbmVQcm9qZWN0KHRoaXMsIGAke3RoaXMuc3RhY2tOYW1lfS1idWlsZGAsIHtcbiAgICAgIHByb2plY3ROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tYnVpbGRgLFxuICAgICAgcm9sZTogY2RrRGVwbG95Um9sZSxcbiAgICAgIGJ1aWxkU3BlYzogQnVpbGRTcGVjLmZyb21PYmplY3Qoe1xuICAgICAgICBlbnY6IHsgJ2dpdC1jcmVkZW50aWFsLWhlbHBlcic6ICd5ZXMnIH0sXG4gICAgICAgIHZlcnNpb246ICcwLjInLFxuICAgICAgICBwaGFzZXM6IHtcbiAgICAgICAgICBpbnN0YWxsOiB7XG4gICAgICAgICAgICAncnVudGltZS12ZXJzaW9ucyc6XG4gICAgICAgICAgICBwcm9wcy5ydW50aW1lLFxuICAgICAgICAgICAgY29tbWFuZHM6IFsnbnBtIGluc3RhbGwnLFxuICAgICAgICAgICAgICBgbnBtIGluc3RhbGwgLWcgYXdzLWNka0Ake3Byb3BzLmNka1ZlcnNpb259YCxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgY29tbWFuZHM6IFtcbiAgICAgICAgICAgICAgJ25wbSBydW4gYnVpbGQnLFxuICAgICAgICAgICAgICAnbHMgLWxhJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBwb3N0X2J1aWxkOiB7XG4gICAgICAgICAgICBjb21tYW5kczpcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAvLyAnbnBtIHJ1biB0ZXN0JyxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIC8vIGFydGlmYWN0czoge1xuICAgICAgICAvLyAgICdiYXNlLWRpcmVjdG9yeSc6ICdidWlsZCcsXG4gICAgICAgIC8vICAgZmlsZXM6IFtcbiAgICAgICAgLy8gICAgICcqKi8qJyxcbiAgICAgICAgLy8gICBdLFxuICAgICAgICAvLyB9LFxuICAgICAgfSksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBidWlsZEltYWdlOiBMaW51eEJ1aWxkSW1hZ2UuU1RBTkRBUkRfNF8wLFxuICAgICAgfSxcbiAgICB9KTtcblxuXG4gICAgY29uc3QgY2RrRGVwbG95QnVpbGQgPSBuZXcgUGlwZWxpbmVQcm9qZWN0KHRoaXMsIGAke3RoaXMuc3RhY2tOYW1lfS1kZXBsb3lCdWlsZGAsIHtcbiAgICAgIHByb2plY3ROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tZGVwbG95QnVpbGRgLFxuICAgICAgcm9sZTogY2RrRGVwbG95Um9sZSxcbiAgICAgIGVudmlyb25tZW50VmFyaWFibGVzOiB7XG4gICAgICAgIGRlcGxveWVyQWNjZXNzS2V5SWQ6IHtcbiAgICAgICAgICB2YWx1ZTogJ2RlcGxveWVyLWFjY2Vzcy1rZXktaWQnLFxuICAgICAgICAgIHR5cGU6IEJ1aWxkRW52aXJvbm1lbnRWYXJpYWJsZVR5cGUuUEFSQU1FVEVSX1NUT1JFLFxuICAgICAgICB9LFxuICAgICAgICBkZXBsb3llclNlY3JldEFjY2Vzc0tleToge1xuICAgICAgICAgIHZhbHVlOiAnZGVwbG95ZXItc2VjcmV0LWFjY2Vzcy1rZXknLFxuICAgICAgICAgIHR5cGU6IEJ1aWxkRW52aXJvbm1lbnRWYXJpYWJsZVR5cGUuUEFSQU1FVEVSX1NUT1JFLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIGJ1aWxkU3BlYzogQnVpbGRTcGVjLmZyb21PYmplY3Qoe1xuICAgICAgICBlbnY6IHsgJ2dpdC1jcmVkZW50aWFsLWhlbHBlcic6ICd5ZXMnIH0sXG4gICAgICAgIHZlcnNpb246ICcwLjInLFxuICAgICAgICBwaGFzZXM6IHtcbiAgICAgICAgICBpbnN0YWxsOiB7XG4gICAgICAgICAgICAncnVudGltZS12ZXJzaW9ucyc6IHByb3BzLnJ1bnRpbWUsXG4gICAgICAgICAgICBjb21tYW5kczogW1xuICAgICAgICAgICAgICAnYXdzIC0tcHJvZmlsZSBkYW1hZGRlbjg4IGNvbmZpZ3VyZSBzZXQgYXdzX2FjY2Vzc19rZXlfaWQgJGRlcGxveWVyQWNjZXNzS2V5SWQnLFxuICAgICAgICAgICAgICAnYXdzIC0tcHJvZmlsZSBkYW1hZGRlbjg4IGNvbmZpZ3VyZSBzZXQgYXdzX3NlY3JldF9hY2Nlc3Nfa2V5ICRkZXBsb3llclNlY3JldEFjY2Vzc0tleScsXG4gICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgYGF3cyAtLXByb2ZpbGUgZGVmYXVsdCBjb25maWd1cmUgc2V0IHJlZ2lvbiAke3Byb3BzLmVudi5yZWdpb259YCxcbiAgICAgICAgICAgICAgLy8gLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAvLyAuLi5jcmVhdGVSb2xlUHJvZmlsZShkZXZBY2NvdW50KSxcbiAgICAgICAgICAgICAgLy8gLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAvLyAuLi5jcmVhdGVSb2xlUHJvZmlsZShxYUFjY291bnQpLFxuICAgICAgICAgICAgICAvLyAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgIC8vIC4uLmNyZWF0ZVJvbGVQcm9maWxlKHByb2RBY2NvdW50KSxcbiAgICAgICAgICAgICAgJ25wbSBpbnN0YWxsJyxcbiAgICAgICAgICAgICAgJ2NkIGNkayAmJiBucG0gaW5zdGFsbCAmJiBjZCAuLicsXG4gICAgICAgICAgICAgIGBucG0gaW5zdGFsbCAtZyBhd3MtY2RrQCR7cHJvcHMuY2RrVmVyc2lvbn1gLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgICBjb21tYW5kczogW1xuICAgICAgICAgICAgICAnbnBtIHJ1biBidWlsZCcsXG4gICAgICAgICAgICAgIC8vICdjZCBidWlsZCAmJiBucG0gaW5zdGFsbCAtLW9ubHk9cHJvZHVjdGlvbiAmJiBjZCAuLicsXG4gICAgICAgICAgICAgICdscyAtbGEnLFxuICAgICAgICAgICAgICAnZWNobyBcInJ1bjogJENES19DT01NQU5EXCInLFxuICAgICAgICAgICAgICAnZXZhbCAkQ0RLX0NPTU1BTkQnLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBhcnRpZmFjdHM6IHtcbiAgICAgICAgICAnYmFzZS1kaXJlY3RvcnknOiAnYnVpbGQnLFxuICAgICAgICAgIGZpbGVzOiBbXG4gICAgICAgICAgICAnKiovKicsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgYnVpbGRJbWFnZTogTGludXhCdWlsZEltYWdlLlNUQU5EQVJEXzRfMCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBzb3VyY2VPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoKTtcbiAgICBjb25zdCBjZGtCdWlsZE91dHB1dCA9IG5ldyBBcnRpZmFjdChgJHt0aGlzLnN0YWNrTmFtZX0tY2RrLWJ1aWxkLW91dHB1dGApO1xuXG4gICAgLy8gY29uc3Qgb2F1dGggPSBTdHJpbmdQYXJhbWV0ZXIudmFsdWVGb3JTZWN1cmVTdHJpbmdQYXJhbWV0ZXIoXG4gICAgLy8gICB0aGlzLCAnbXVsbGVyODgtZ2l0aHViLXRva2VuJywgMSk7XG4gICAgY29uc3Qgb2F1dGggPSBTZWNyZXRWYWx1ZS5zZWNyZXRzTWFuYWdlcignYWxmY2RrJywge1xuICAgICAganNvbkZpZWxkOiAnbXVsbGVyODgtZ2l0aHViLXRva2VuJyxcbiAgICB9KTtcblxuICAgIGNvbnN0IGdpdFNvdXJjZSA9IG5ldyBHaXRIdWJTb3VyY2VBY3Rpb24oe1xuICAgICAgYWN0aW9uTmFtZTogJ0dpdGh1YlNvdXJjZScsXG4gICAgICBicmFuY2g6IHByb3BzLmJyYW5jaCxcbiAgICAgIG93bmVyOiAnbW11bGxlcjg4JyxcbiAgICAgIHJlcG86ICdhbGYtY2RrLXVpJyxcbiAgICAgIG9hdXRoVG9rZW46IG9hdXRoLFxuICAgICAgb3V0cHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgfSk7XG5cbiAgICBwaXBlbGluZS5hZGRTdGFnZSh7XG4gICAgICBzdGFnZU5hbWU6ICdTb3VyY2UnLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICBnaXRTb3VyY2UsXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgcGlwZWxpbmUuYWRkU3RhZ2Uoe1xuICAgICAgc3RhZ2VOYW1lOiAnQnVpbGQnLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICBuZXcgQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgICAgICBhY3Rpb25OYW1lOiAnQ2RrTGludEFuZEJ1aWxkJyxcbiAgICAgICAgICBwcm9qZWN0OiBjZGtCdWlsZCxcbiAgICAgICAgICBpbnB1dDogc291cmNlT3V0cHV0LFxuICAgICAgICAgIG91dHB1dHM6IFtjZGtCdWlsZE91dHB1dF0sXG4gICAgICAgIH0pLFxuICAgICAgXSxcbiAgICB9KTtcblxuLy8gdG9kbzogYWRkIGRldkFjY291bnQgbGF0ZXJcbiAgICBmb3IgKGNvbnN0IGFjY291bnQgb2YgW3Byb2RBY2NvdW50XSkge1xuICAgICAgY29uc3QgZGVwbG95U3RhZ2UgPSBwaXBlbGluZS5hZGRTdGFnZSh7XG4gICAgICAgIHN0YWdlTmFtZTogYERlcGxveVN0YWdlJHthY2NvdW50LnN0YWdlWzBdLnRvVXBwZXJDYXNlKCl9JHthY2NvdW50LnN0YWdlLnNsaWNlKDEpfWAsXG4gICAgICB9KTtcblxuICAgICAgZGVwbG95U3RhZ2UuYWRkQWN0aW9uKG5ldyBDb2RlQnVpbGRBY3Rpb24oe1xuICAgICAgICBpbnB1dDogc291cmNlT3V0cHV0LFxuICAgICAgICBlbnZpcm9ubWVudFZhcmlhYmxlczoge1xuICAgICAgICAgIENES19DT01NQU5EOiB7IHZhbHVlOiBgY2QgY2RrICYmIGNkayBkaWZmICcke3RoaXMuc3RhY2tOYW1lfS0ke2FjY291bnQuc3RhZ2V9JyAtLXByb2ZpbGUgdW5pbWVkLSR7YWNjb3VudC5zdGFnZX0gfHwgdHJ1ZWAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgcHJvamVjdDogY2RrRGVwbG95QnVpbGQsXG4gICAgICAgIGFjdGlvbk5hbWU6ICdDcmVhdGVEaWZmJyxcbiAgICAgICAgcnVuT3JkZXI6IDEsXG4gICAgICB9KSk7XG5cbiAgICAgIC8vIElmIG5vdCBpbiBkZXYgc3RhZ2UsIGFzayBmb3IgYXBwcm92ZW1lbnQgYmVmb3JlIGRlcGxveWluZ1xuICAgICAgLy8gaWYgKGFjY291bnQuaWQgIT09IGRldkFjY291bnQuaWQpIHtcbiAgICAgIC8vICAgZGVwbG95U3RhZ2UuYWRkQWN0aW9uKG5ldyBNYW51YWxBcHByb3ZhbEFjdGlvbih7XG4gICAgICAvLyAgICAgYWN0aW9uTmFtZTogJ0FwcHJvdmVEaWZmJyxcbiAgICAgIC8vICAgICBydW5PcmRlcjogMixcbiAgICAgIC8vICAgfSkpO1xuICAgICAgLy8gfVxuXG4gICAgICBkZXBsb3lTdGFnZS5hZGRBY3Rpb24obmV3IENvZGVCdWlsZEFjdGlvbih7XG4gICAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgIGVudmlyb25tZW50VmFyaWFibGVzOiB7XG4gICAgICAgICAgLy8gQ0RLX0NPTU1BTkQ6IHsgdmFsdWU6IGBjZGsgZGVwbG95ICcke3RoaXMuc3RhY2tOYW1lfS0ke2FjY291bnQuc3RhZ2V9JyAtLXJlcXVpcmUtYXBwcm92YWwgbmV2ZXIgLS1wcm9maWxlICR7YWNjb3VudC5zdGFnZX1gIH0sXG4gICAgICAgICAgQ0RLX0NPTU1BTkQ6IHsgdmFsdWU6IGBtYWtlIGNka2RlcGxveSR7YWNjb3VudC5zdGFnZX1gIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHByb2plY3Q6IGNka0RlcGxveUJ1aWxkLFxuICAgICAgICBhY3Rpb25OYW1lOiAnRGVwbG95QnVpbGQnLFxuICAgICAgICBydW5PcmRlcjogMyxcbiAgICAgIH0pKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==