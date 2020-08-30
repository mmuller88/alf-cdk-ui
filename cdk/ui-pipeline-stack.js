"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIPipelineStack = void 0;
const aws_codecommit_1 = require("@aws-cdk/aws-codecommit");
const aws_codepipeline_1 = require("@aws-cdk/aws-codepipeline");
const aws_codepipeline_actions_1 = require("@aws-cdk/aws-codepipeline-actions");
const core_1 = require("@aws-cdk/core");
const aws_iam_1 = require("@aws-cdk/aws-iam");
const aws_codebuild_1 = require("@aws-cdk/aws-codebuild");
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
        core_1.Tag.add(this, 'FrontendPipeline', this.stackName);
        const pipeline = new aws_codepipeline_1.Pipeline(this, `${this.stackName}-pipeline`, {
            pipelineName: `${this.stackName}-pipeline`,
        });
        const code = aws_codecommit_1.Repository.fromRepositoryName(this, `${this.stackName}-repo`, props.repositoryName);
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
        const codeCommitSourceAction = new aws_codepipeline_actions_1.CodeCommitSourceAction({
            actionName: 'CodeCommitSource',
            branch: props.branch,
            repository: code,
            output: sourceOutput,
        });
        pipeline.addStage({
            stageName: 'Source',
            actions: [
                codeCommitSourceAction,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktcGlwZWxpbmUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1aS1waXBlbGluZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw0REFBcUQ7QUFDckQsZ0VBQStEO0FBQy9ELGdGQUE0RjtBQUM1Rix3Q0FBNEQ7QUFDNUQsOENBQXlFO0FBQ3pFLDBEQUFtSDtBQUNuSCx1Q0FBdUM7QUFFdkMsTUFBTSxXQUFXLEdBQUc7SUFDbEIsRUFBRSxFQUFFLGNBQWM7SUFDbEIsTUFBTSxFQUFFLFdBQVc7SUFDbkIsS0FBSyxFQUFFLE1BQU07SUFDYixVQUFVLEVBQUUsWUFBWTtJQUN4QixTQUFTLEVBQUUsS0FBSztJQUNoQixVQUFVLEVBQUUscUZBQXFGO0NBRWxHLENBQUE7QUFVRCx1REFBdUQ7QUFDdkQsYUFBYTtBQUNiLHVGQUF1RjtBQUN2RixnSUFBZ0k7QUFDaEksaUdBQWlHO0FBQ2pHLE9BQU87QUFDUCxJQUFJO0FBRUosTUFBYSxlQUFnQixTQUFRLFlBQUs7SUFDeEMsWUFBWSxHQUFRLEVBQUUsRUFBVSxFQUFFLEtBQTJCO1FBQzNELEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXRCLFVBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUVsRCxNQUFNLFFBQVEsR0FBRyxJQUFJLDJCQUFRLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLFNBQVMsV0FBVyxFQUFFO1lBQ2hFLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLFdBQVc7U0FDM0MsQ0FBQyxDQUFDO1FBRUgsTUFBTSxJQUFJLEdBQUcsMkJBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsU0FBUyxPQUFPLEVBQUUsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRWpHLE1BQU0sYUFBYSxHQUFH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RUFBRTtvQkFDcEIsV0FBVyxFQUFFLEVBQUUsS0FBSyxFQUFFLHVCQUF1QixJQUFJLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQyxLQUFLLHNCQUFzQixPQUFPLENBQUMsS0FBSyxVQUFVLEVBQUU7aUJBQzVIO2dCQUNELE9BQU8sRUFBRSxjQUFjO2dCQUN2QixVQUFVLEVBQUUsWUFBWTtnQkFDeEIsUUFBUSxFQUFFLENBQUM7YUFDWixDQUFDLENBQUMsQ0FBQztZQUVKLDREQUE0RDtZQUM1RCxzQ0FBc0M7WUFDdEMscURBQXFEO1lBQ3JELGlDQUFpQztZQUNqQyxtQkFBbUI7WUFDbkIsU0FBUztZQUNULElBQUk7WUFFSixXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksMENBQWUsQ0FBQztnQkFDeEMsS0FBSyxFQUFFLFlBQVk7Z0JBQ25CLG9CQUFvQixFQUFFO29CQUNwQixpSUFBaUk7b0JBQ2pJLFdBQVcsRUFBRSxFQUFFLEtBQUssRUFBRSxpQkFBaUIsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFO2lCQUN6RDtnQkFDRCxPQUFPLEVBQUUsY0FBYztnQkFDdkIsVUFBVSxFQUFFLGFBQWE7Z0JBQ3pCLFFBQVEsRUFBRSxDQUFDO2FBQ1osQ0FBQyxDQUFDLENBQUM7U0FDTDtJQUNILENBQUM7Q0FDRjtBQXhMRCwwQ0F3TEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBSZXBvc2l0b3J5IH0gZnJvbSAnQGF3cy1jZGsvYXdzLWNvZGVjb21taXQnO1xuaW1wb3J0IHsgUGlwZWxpbmUsIEFydGlmYWN0IH0gZnJvbSAnQGF3cy1jZGsvYXdzLWNvZGVwaXBlbGluZSc7XG5pbXBvcnQgeyBDb2RlQ29tbWl0U291cmNlQWN0aW9uLCBDb2RlQnVpbGRBY3Rpb24gfSBmcm9tICdAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lLWFjdGlvbnMnO1xuaW1wb3J0IHsgQXBwLCBTdGFjaywgU3RhY2tQcm9wcywgVGFnIH0gZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgeyBTZXJ2aWNlUHJpbmNpcGFsLCBSb2xlLCBNYW5hZ2VkUG9saWN5IH0gZnJvbSAnQGF3cy1jZGsvYXdzLWlhbSc7XG5pbXBvcnQgeyBCdWlsZEVudmlyb25tZW50VmFyaWFibGVUeXBlLCBQaXBlbGluZVByb2plY3QsIEJ1aWxkU3BlYywgTGludXhCdWlsZEltYWdlIH0gZnJvbSAnQGF3cy1jZGsvYXdzLWNvZGVidWlsZCc7XG4vLyBpbXBvcnQgeyBwcm9kQWNjb3VudCB9IGZyb20gJy4vYXBwJztcblxuY29uc3QgcHJvZEFjY291bnQgPSB7XG4gIGlkOiAnOTgxMjM3MTkzMjg4JyxcbiAgcmVnaW9uOiAndXMtZWFzdC0xJyxcbiAgc3RhZ2U6ICdwcm9kJyxcbiAgZG9tYWluTmFtZTogJ2FsZnByby5uZXQnLFxuICBzdWJEb21haW46ICdhcHAnLFxuICBhY21DZXJ0UmVmOiAnYXJuOmF3czphY206dXMtZWFzdC0xOjk4MTIzNzE5MzI4ODpjZXJ0aWZpY2F0ZS82MjAxMGZjYS0xMjVlLTQ3ODAtOGQ3MS03ZDc0NWZmOTE3ODknLFxuICAvLyBzdWJEb21haW46IHByb2Nlc3MuZW52LlNVQl9ET01BSU4gfHwgJ2FwcCcsXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVUlQaXBlbGluZVN0YWNrUHJvcHMgZXh0ZW5kcyBTdGFja1Byb3BzIHtcbiAgY2RrVmVyc2lvbjogc3RyaW5nO1xuICAvLyBkb21haW5OYW1lOiBzdHJpbmc7XG4gIHJlcG9zaXRvcnlOYW1lOiBzdHJpbmc7XG4gIGJyYW5jaDogc3RyaW5nO1xuICBydW50aW1lOiB7W2s6IHN0cmluZ106IHN0cmluZyB8IG51bWJlcn07XG59XG5cbi8vIGZ1bmN0aW9uIGNyZWF0ZVJvbGVQcm9maWxlKGFjY291bnQ6IEFjY291bnRDb25maWcpIHtcbi8vICAgcmV0dXJuIFtcbi8vICAgICBgYXdzIC0tcHJvZmlsZSB1bmltZWQtJHthY2NvdW50LnN0YWdlfSBjb25maWd1cmUgc2V0IHNvdXJjZV9wcm9maWxlIGRhbWFkZGVuODhgLFxuLy8gICAgIGBhd3MgLS1wcm9maWxlIHVuaW1lZC0ke2FjY291bnQuc3RhZ2V9IGNvbmZpZ3VyZSBzZXQgcm9sZV9hcm4gJ2Fybjphd3M6aWFtOjoke2FjY291bnQuaWR9OnJvbGUvdW5pbWVkLSR7YWNjb3VudC5zdGFnZX0nYCxcbi8vICAgICBgYXdzIC0tcHJvZmlsZSB1bmltZWQtJHthY2NvdW50LnN0YWdlfSBjb25maWd1cmUgc2V0IHJlZ2lvbiAke0FsbG93ZWRSZWdpb25zLmV1Q2VudHJhbDF9YCxcbi8vICAgXTtcbi8vIH1cblxuZXhwb3J0IGNsYXNzIFVJUGlwZWxpbmVTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIGlkOiBzdHJpbmcsIHByb3BzOiBVSVBpcGVsaW5lU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKGFwcCwgaWQsIHByb3BzKTtcblxuICAgIFRhZy5hZGQodGhpcywgJ0Zyb250ZW5kUGlwZWxpbmUnLCB0aGlzLnN0YWNrTmFtZSk7XG5cbiAgICBjb25zdCBwaXBlbGluZSA9IG5ldyBQaXBlbGluZSh0aGlzLCBgJHt0aGlzLnN0YWNrTmFtZX0tcGlwZWxpbmVgLCB7XG4gICAgICBwaXBlbGluZU5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1waXBlbGluZWAsXG4gICAgfSk7XG5cbiAgICBjb25zdCBjb2RlID0gUmVwb3NpdG9yeS5mcm9tUmVwb3NpdG9yeU5hbWUodGhpcywgYCR7dGhpcy5zdGFja05hbWV9LXJlcG9gLCBwcm9wcy5yZXBvc2l0b3J5TmFtZSk7XG5cbiAgICBjb25zdCBjZGtEZXBsb3lSb2xlID0gbmV3IFJvbGUodGhpcywgJ2NyZWF0ZUluc3RhbmNlQnVpbGRSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgU2VydmljZVByaW5jaXBhbCgnY29kZWJ1aWxkLmFtYXpvbmF3cy5jb20nKSwgICAvLyByZXF1aXJlZFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIC8vIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdDbG91ZFdhdGNoTG9nc0Z1bGxBY2Nlc3MnKSxcbiAgICAgICAgLy8gTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvblMzRnVsbEFjY2VzcycpLFxuICAgICAgICAvLyBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQVdTQ2xvdWRGb3JtYXRpb25GdWxsQWNjZXNzJyksXG4gICAgICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBZG1pbmlzdHJhdG9yQWNjZXNzJyksIC8vIFRPRE8gZmluZCBvdXQgdGhlIHJpZ2h0IHBlcm1pc3Npb25zXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY2RrQnVpbGQgPSBuZXcgUGlwZWxpbmVQcm9qZWN0KHRoaXMsIGAke3RoaXMuc3RhY2tOYW1lfS1idWlsZGAsIHtcbiAgICAgIHByb2plY3ROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tYnVpbGRgLFxuICAgICAgcm9sZTogY2RrRGVwbG95Um9sZSxcbiAgICAgIGJ1aWxkU3BlYzogQnVpbGRTcGVjLmZyb21PYmplY3Qoe1xuICAgICAgICBlbnY6IHsgJ2dpdC1jcmVkZW50aWFsLWhlbHBlcic6ICd5ZXMnIH0sXG4gICAgICAgIHZlcnNpb246ICcwLjInLFxuICAgICAgICBwaGFzZXM6IHtcbiAgICAgICAgICBpbnN0YWxsOiB7XG4gICAgICAgICAgICAncnVudGltZS12ZXJzaW9ucyc6XG4gICAgICAgICAgICBwcm9wcy5ydW50aW1lLFxuICAgICAgICAgICAgY29tbWFuZHM6IFsnbnBtIGluc3RhbGwnLFxuICAgICAgICAgICAgICBgbnBtIGluc3RhbGwgLWcgYXdzLWNka0Ake3Byb3BzLmNka1ZlcnNpb259YCxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgY29tbWFuZHM6IFtcbiAgICAgICAgICAgICAgJ25wbSBydW4gYnVpbGQnLFxuICAgICAgICAgICAgICAnbHMgLWxhJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBwb3N0X2J1aWxkOiB7XG4gICAgICAgICAgICBjb21tYW5kczpcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAvLyAnbnBtIHJ1biB0ZXN0JyxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIC8vIGFydGlmYWN0czoge1xuICAgICAgICAvLyAgICdiYXNlLWRpcmVjdG9yeSc6ICdidWlsZCcsXG4gICAgICAgIC8vICAgZmlsZXM6IFtcbiAgICAgICAgLy8gICAgICcqKi8qJyxcbiAgICAgICAgLy8gICBdLFxuICAgICAgICAvLyB9LFxuICAgICAgfSksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBidWlsZEltYWdlOiBMaW51eEJ1aWxkSW1hZ2UuU1RBTkRBUkRfNF8wLFxuICAgICAgfSxcbiAgICB9KTtcblxuXG4gICAgY29uc3QgY2RrRGVwbG95QnVpbGQgPSBuZXcgUGlwZWxpbmVQcm9qZWN0KHRoaXMsIGAke3RoaXMuc3RhY2tOYW1lfS1kZXBsb3lCdWlsZGAsIHtcbiAgICAgIHByb2plY3ROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tZGVwbG95QnVpbGRgLFxuICAgICAgcm9sZTogY2RrRGVwbG95Um9sZSxcbiAgICAgIGVudmlyb25tZW50VmFyaWFibGVzOiB7XG4gICAgICAgIGRlcGxveWVyQWNjZXNzS2V5SWQ6IHtcbiAgICAgICAgICB2YWx1ZTogJ2RlcGxveWVyLWFjY2Vzcy1rZXktaWQnLFxuICAgICAgICAgIHR5cGU6IEJ1aWxkRW52aXJvbm1lbnRWYXJpYWJsZVR5cGUuUEFSQU1FVEVSX1NUT1JFLFxuICAgICAgICB9LFxuICAgICAgICBkZXBsb3llclNlY3JldEFjY2Vzc0tleToge1xuICAgICAgICAgIHZhbHVlOiAnZGVwbG95ZXItc2VjcmV0LWFjY2Vzcy1rZXknLFxuICAgICAgICAgIHR5cGU6IEJ1aWxkRW52aXJvbm1lbnRWYXJpYWJsZVR5cGUuUEFSQU1FVEVSX1NUT1JFLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIGJ1aWxkU3BlYzogQnVpbGRTcGVjLmZyb21PYmplY3Qoe1xuICAgICAgICBlbnY6IHsgJ2dpdC1jcmVkZW50aWFsLWhlbHBlcic6ICd5ZXMnIH0sXG4gICAgICAgIHZlcnNpb246ICcwLjInLFxuICAgICAgICBwaGFzZXM6IHtcbiAgICAgICAgICBpbnN0YWxsOiB7XG4gICAgICAgICAgICAncnVudGltZS12ZXJzaW9ucyc6IHByb3BzLnJ1bnRpbWUsXG4gICAgICAgICAgICBjb21tYW5kczogW1xuICAgICAgICAgICAgICAnYXdzIC0tcHJvZmlsZSBkYW1hZGRlbjg4IGNvbmZpZ3VyZSBzZXQgYXdzX2FjY2Vzc19rZXlfaWQgJGRlcGxveWVyQWNjZXNzS2V5SWQnLFxuICAgICAgICAgICAgICAnYXdzIC0tcHJvZmlsZSBkYW1hZGRlbjg4IGNvbmZpZ3VyZSBzZXQgYXdzX3NlY3JldF9hY2Nlc3Nfa2V5ICRkZXBsb3llclNlY3JldEFjY2Vzc0tleScsXG4gICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgYGF3cyAtLXByb2ZpbGUgZGVmYXVsdCBjb25maWd1cmUgc2V0IHJlZ2lvbiAke3Byb3BzLmVudi5yZWdpb259YCxcbiAgICAgICAgICAgICAgLy8gLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAvLyAuLi5jcmVhdGVSb2xlUHJvZmlsZShkZXZBY2NvdW50KSxcbiAgICAgICAgICAgICAgLy8gLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAvLyAuLi5jcmVhdGVSb2xlUHJvZmlsZShxYUFjY291bnQpLFxuICAgICAgICAgICAgICAvLyAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgIC8vIC4uLmNyZWF0ZVJvbGVQcm9maWxlKHByb2RBY2NvdW50KSxcbiAgICAgICAgICAgICAgJ25wbSBpbnN0YWxsJyxcbiAgICAgICAgICAgICAgJ2NkIGNkayAmJiBucG0gaW5zdGFsbCAmJiBjZCAuLicsXG4gICAgICAgICAgICAgIGBucG0gaW5zdGFsbCAtZyBhd3MtY2RrQCR7cHJvcHMuY2RrVmVyc2lvbn1gLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgICBjb21tYW5kczogW1xuICAgICAgICAgICAgICAnbnBtIHJ1biBidWlsZCcsXG4gICAgICAgICAgICAgIC8vICdjZCBidWlsZCAmJiBucG0gaW5zdGFsbCAtLW9ubHk9cHJvZHVjdGlvbiAmJiBjZCAuLicsXG4gICAgICAgICAgICAgICdscyAtbGEnLFxuICAgICAgICAgICAgICAnZWNobyBcInJ1bjogJENES19DT01NQU5EXCInLFxuICAgICAgICAgICAgICAnZXZhbCAkQ0RLX0NPTU1BTkQnLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBhcnRpZmFjdHM6IHtcbiAgICAgICAgICAnYmFzZS1kaXJlY3RvcnknOiAnYnVpbGQnLFxuICAgICAgICAgIGZpbGVzOiBbXG4gICAgICAgICAgICAnKiovKicsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgYnVpbGRJbWFnZTogTGludXhCdWlsZEltYWdlLlNUQU5EQVJEXzRfMCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBzb3VyY2VPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoKTtcbiAgICBjb25zdCBjZGtCdWlsZE91dHB1dCA9IG5ldyBBcnRpZmFjdChgJHt0aGlzLnN0YWNrTmFtZX0tY2RrLWJ1aWxkLW91dHB1dGApO1xuXG4gICAgY29uc3QgY29kZUNvbW1pdFNvdXJjZUFjdGlvbiA9IG5ldyBDb2RlQ29tbWl0U291cmNlQWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6ICdDb2RlQ29tbWl0U291cmNlJyxcbiAgICAgIGJyYW5jaDogcHJvcHMuYnJhbmNoLFxuICAgICAgcmVwb3NpdG9yeTogY29kZSxcbiAgICAgIG91dHB1dDogc291cmNlT3V0cHV0LFxuICAgIH0pO1xuXG4gICAgcGlwZWxpbmUuYWRkU3RhZ2Uoe1xuICAgICAgc3RhZ2VOYW1lOiAnU291cmNlJyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgY29kZUNvbW1pdFNvdXJjZUFjdGlvbixcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICBwaXBlbGluZS5hZGRTdGFnZSh7XG4gICAgICBzdGFnZU5hbWU6ICdCdWlsZCcsXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgIG5ldyBDb2RlQnVpbGRBY3Rpb24oe1xuICAgICAgICAgIGFjdGlvbk5hbWU6ICdDZGtMaW50QW5kQnVpbGQnLFxuICAgICAgICAgIHByb2plY3Q6IGNka0J1aWxkLFxuICAgICAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgICAgb3V0cHV0czogW2Nka0J1aWxkT3V0cHV0XSxcbiAgICAgICAgfSksXG4gICAgICBdLFxuICAgIH0pO1xuXG4vLyB0b2RvOiBhZGQgZGV2QWNjb3VudCBsYXRlclxuICAgIGZvciAoY29uc3QgYWNjb3VudCBvZiBbcHJvZEFjY291bnRdKSB7XG4gICAgICBjb25zdCBkZXBsb3lTdGFnZSA9IHBpcGVsaW5lLmFkZFN0YWdlKHtcbiAgICAgICAgc3RhZ2VOYW1lOiBgRGVwbG95U3RhZ2Uke2FjY291bnQuc3RhZ2VbMF0udG9VcHBlckNhc2UoKX0ke2FjY291bnQuc3RhZ2Uuc2xpY2UoMSl9YCxcbiAgICAgIH0pO1xuXG4gICAgICBkZXBsb3lTdGFnZS5hZGRBY3Rpb24obmV3IENvZGVCdWlsZEFjdGlvbih7XG4gICAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgIGVudmlyb25tZW50VmFyaWFibGVzOiB7XG4gICAgICAgICAgQ0RLX0NPTU1BTkQ6IHsgdmFsdWU6IGBjZCBjZGsgJiYgY2RrIGRpZmYgJyR7dGhpcy5zdGFja05hbWV9LSR7YWNjb3VudC5zdGFnZX0nIC0tcHJvZmlsZSB1bmltZWQtJHthY2NvdW50LnN0YWdlfSB8fCB0cnVlYCB9LFxuICAgICAgICB9LFxuICAgICAgICBwcm9qZWN0OiBjZGtEZXBsb3lCdWlsZCxcbiAgICAgICAgYWN0aW9uTmFtZTogJ0NyZWF0ZURpZmYnLFxuICAgICAgICBydW5PcmRlcjogMSxcbiAgICAgIH0pKTtcblxuICAgICAgLy8gSWYgbm90IGluIGRldiBzdGFnZSwgYXNrIGZvciBhcHByb3ZlbWVudCBiZWZvcmUgZGVwbG95aW5nXG4gICAgICAvLyBpZiAoYWNjb3VudC5pZCAhPT0gZGV2QWNjb3VudC5pZCkge1xuICAgICAgLy8gICBkZXBsb3lTdGFnZS5hZGRBY3Rpb24obmV3IE1hbnVhbEFwcHJvdmFsQWN0aW9uKHtcbiAgICAgIC8vICAgICBhY3Rpb25OYW1lOiAnQXBwcm92ZURpZmYnLFxuICAgICAgLy8gICAgIHJ1bk9yZGVyOiAyLFxuICAgICAgLy8gICB9KSk7XG4gICAgICAvLyB9XG5cbiAgICAgIGRlcGxveVN0YWdlLmFkZEFjdGlvbihuZXcgQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgICAgaW5wdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgICAgZW52aXJvbm1lbnRWYXJpYWJsZXM6IHtcbiAgICAgICAgICAvLyBDREtfQ09NTUFORDogeyB2YWx1ZTogYGNkayBkZXBsb3kgJyR7dGhpcy5zdGFja05hbWV9LSR7YWNjb3VudC5zdGFnZX0nIC0tcmVxdWlyZS1hcHByb3ZhbCBuZXZlciAtLXByb2ZpbGUgJHthY2NvdW50LnN0YWdlfWAgfSxcbiAgICAgICAgICBDREtfQ09NTUFORDogeyB2YWx1ZTogYG1ha2UgY2RrZGVwbG95JHthY2NvdW50LnN0YWdlfWAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgcHJvamVjdDogY2RrRGVwbG95QnVpbGQsXG4gICAgICAgIGFjdGlvbk5hbWU6ICdEZXBsb3lCdWlsZCcsXG4gICAgICAgIHJ1bk9yZGVyOiAzLFxuICAgICAgfSkpO1xuICAgIH1cbiAgfVxufVxuIl19