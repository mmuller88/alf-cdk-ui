"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIPipelineStack = void 0;
const aws_codepipeline_1 = require("@aws-cdk/aws-codepipeline");
const aws_codepipeline_actions_1 = require("@aws-cdk/aws-codepipeline-actions");
const core_1 = require("@aws-cdk/core");
// import { ServicePrincipal, Role, ManagedPolicy } from '@aws-cdk/aws-iam';
// import { BuildEnvironmentVariableType, PipelineProject, BuildSpec, LinuxBuildImage } from '@aws-cdk/aws-codebuild';
const accountConfig_1 = require("./accountConfig");
const pipelines_1 = require("@aws-cdk/pipelines");
const frontend_stage_1 = require("./frontend-stage");
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
        // const pipeline = new Pipeline(this, `${this.stackName}-pipeline`, {
        //   pipelineName: `${this.stackName}-pipeline`,
        // });
        // const cdkDeployRole = new Role(this, 'createInstanceBuildRole', {
        //   assumedBy: new ServicePrincipal('codebuild.amazonaws.com'),
        //   managedPolicies: [
        //     ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
        //   ],
        // });
        const sourceOutput = new aws_codepipeline_1.Artifact();
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
        // pipeline.addStage({
        //   stageName: 'Source',
        //   actions: [
        //     gitSource,
        //   ],
        // });
        const sourceArtifact = new aws_codepipeline_1.Artifact();
        const cloudAssemblyArtifact = new aws_codepipeline_1.Artifact();
        const pipeline = new pipelines_1.CdkPipeline(this, 'Pipeline', {
            // The pipeline name
            pipelineName: `${this.stackName}-pipeline`,
            cloudAssemblyArtifact,
            // Where the source can be found
            sourceAction: gitSource,
            // How it will be built and synthesized
            synthAction: pipelines_1.SimpleSynthAction.standardNpmSynth({
                sourceArtifact,
                cloudAssemblyArtifact,
                // We need a build step to compile the TypeScript Lambda
                buildCommand: 'npm run build'
            }),
        });
        // todo: add devAccount later
        for (const account of [accountConfig_1.prodAccount]) {
            pipeline.addApplicationStage(new frontend_stage_1.FrontendStage(this, 'FrontendStage', {
                env: {
                    account: account.id,
                    region: account.region,
                },
            }));
        }
    }
}
exports.UIPipelineStack = UIPipelineStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktcGlwZWxpbmUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9jZGsvdWktcGlwZWxpbmUtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsZ0VBQXFEO0FBQ3JELGdGQUF1RTtBQUN2RSx3Q0FBMEU7QUFDMUUsNEVBQTRFO0FBQzVFLHNIQUFzSDtBQUN0SCxtREFBOEM7QUFDOUMsa0RBQW9FO0FBQ3BFLHFEQUFpRDtBQVlqRCx1REFBdUQ7QUFDdkQsYUFBYTtBQUNiLHVGQUF1RjtBQUN2RixnSUFBZ0k7QUFDaEksaUdBQWlHO0FBQ2pHLE9BQU87QUFDUCxJQUFJO0FBRUosTUFBYSxlQUFnQixTQUFRLFlBQUs7SUFDeEMsWUFBWSxHQUFRLEVBQUUsRUFBVSxFQUFFLEtBQTJCO1FBQzNELEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXRCLFdBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUV0RCxzRUFBc0U7UUFDdEUsZ0RBQWdEO1FBQ2hELE1BQU07UUFFTixvRUFBb0U7UUFDcEUsZ0VBQWdFO1FBQ2hFLHVCQUF1QjtRQUN2QixxRUFBcUU7UUFDckUsT0FBTztRQUNQLE1BQU07UUFHTixNQUFNLFlBQVksR0FBRyxJQUFJLDJCQUFRLEVBQUUsQ0FBQztRQUVwQywrREFBK0Q7UUFDL0QsdUNBQXVDO1FBQ3ZDLE1BQU0sS0FBSyxHQUFHLGtCQUFXLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRTtZQUNqRCxTQUFTLEVBQUUsdUJBQXVCO1NBQ25DLENBQUMsQ0FBQztRQUVILE1BQU0sU0FBUyxHQUFHLElBQUksNkNBQWtCLENBQUM7WUFDdkMsVUFBVSxFQUFFLGNBQWM7WUFDMUIsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNO1lBQ3BCLEtBQUssRUFBRSxXQUFXO1lBQ2xCLElBQUksRUFBRSxZQUFZO1lBQ2xCLFVBQVUsRUFBRSxLQUFLO1lBQ2pCLE1BQU0sRUFBRSxZQUFZO1NBQ3JCLENBQUMsQ0FBQztRQUVILHNCQUFzQjtRQUN0Qix5QkFBeUI7UUFDekIsZUFBZTtRQUNmLGlCQUFpQjtRQUNqQixPQUFPO1FBQ1AsTUFBTTtRQUVOLE1BQU0sY0FBYyxHQUFHLElBQUksMkJBQVEsRUFBRSxDQUFDO1FBQ3RDLE1BQU0scUJBQXFCLEdBQUcsSUFBSSwyQkFBUSxFQUFFLENBQUM7UUFFN0MsTUFBTSxRQUFRLEdBQUcsSUFBSSx1QkFBVyxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDakQsb0JBQW9CO1lBQ3BCLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLFdBQVc7WUFDMUMscUJBQXFCO1lBRXJCLGdDQUFnQztZQUNoQyxZQUFZLEVBQUUsU0FBUztZQUV0Qix1Q0FBdUM7WUFDdkMsV0FBVyxFQUFFLDZCQUFpQixDQUFDLGdCQUFnQixDQUFDO2dCQUM5QyxjQUFjO2dCQUNkLHFCQUFxQjtnQkFFckIsd0RBQXdEO2dCQUN4RCxZQUFZLEVBQUUsZUFBZTthQUM5QixDQUFDO1NBQ0osQ0FBQyxDQUFDO1FBRUgsNkJBQTZCO1FBQzdCLEtBQUssTUFBTSxPQUFPLElBQUksQ0FBQywyQkFBVyxDQUFDLEVBQUU7WUFDbkMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLElBQUksOEJBQWEsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO2dCQUNwRSxHQUFHLEVBQUU7b0JBQ0gsT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUFFO29CQUNuQixNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU07aUJBQ3ZCO2FBQ0YsQ0FBQyxDQUFDLENBQUM7U0FDTDtJQUNILENBQUM7Q0FDRjtBQXpFRCwwQ0F5RUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcnRpZmFjdCB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1jb2RlcGlwZWxpbmUnO1xuaW1wb3J0IHsgR2l0SHViU291cmNlQWN0aW9uIH0gZnJvbSAnQGF3cy1jZGsvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zJztcbmltcG9ydCB7IEFwcCwgU3RhY2ssIFN0YWNrUHJvcHMsIFNlY3JldFZhbHVlLCBUYWdzIH0gZnJvbSAnQGF3cy1jZGsvY29yZSc7XG4vLyBpbXBvcnQgeyBTZXJ2aWNlUHJpbmNpcGFsLCBSb2xlLCBNYW5hZ2VkUG9saWN5IH0gZnJvbSAnQGF3cy1jZGsvYXdzLWlhbSc7XG4vLyBpbXBvcnQgeyBCdWlsZEVudmlyb25tZW50VmFyaWFibGVUeXBlLCBQaXBlbGluZVByb2plY3QsIEJ1aWxkU3BlYywgTGludXhCdWlsZEltYWdlIH0gZnJvbSAnQGF3cy1jZGsvYXdzLWNvZGVidWlsZCc7XG5pbXBvcnQgeyBwcm9kQWNjb3VudCB9IGZyb20gJy4vYWNjb3VudENvbmZpZyc7XG5pbXBvcnQgeyBDZGtQaXBlbGluZSwgU2ltcGxlU3ludGhBY3Rpb24gfSBmcm9tIFwiQGF3cy1jZGsvcGlwZWxpbmVzXCI7XG5pbXBvcnQgeyBGcm9udGVuZFN0YWdlIH0gZnJvbSAnLi9mcm9udGVuZC1zdGFnZSc7XG4vLyBpbXBvcnQgeyBTdHJpbmdQYXJhbWV0ZXIgfSBmcm9tICdAYXdzLWNkay9hd3Mtc3NtJztcbi8vIGltcG9ydCB7IHByb2RBY2NvdW50IH0gZnJvbSAnLi9hcHAnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFVJUGlwZWxpbmVTdGFja1Byb3BzIGV4dGVuZHMgU3RhY2tQcm9wcyB7XG4gIGNka1ZlcnNpb246IHN0cmluZztcbiAgLy8gZG9tYWluTmFtZTogc3RyaW5nO1xuICByZXBvc2l0b3J5TmFtZTogc3RyaW5nO1xuICBicmFuY2g6IHN0cmluZztcbiAgcnVudGltZToge1trOiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXJ9O1xufVxuXG4vLyBmdW5jdGlvbiBjcmVhdGVSb2xlUHJvZmlsZShhY2NvdW50OiBBY2NvdW50Q29uZmlnKSB7XG4vLyAgIHJldHVybiBbXG4vLyAgICAgYGF3cyAtLXByb2ZpbGUgdW5pbWVkLSR7YWNjb3VudC5zdGFnZX0gY29uZmlndXJlIHNldCBzb3VyY2VfcHJvZmlsZSBkYW1hZGRlbjg4YCxcbi8vICAgICBgYXdzIC0tcHJvZmlsZSB1bmltZWQtJHthY2NvdW50LnN0YWdlfSBjb25maWd1cmUgc2V0IHJvbGVfYXJuICdhcm46YXdzOmlhbTo6JHthY2NvdW50LmlkfTpyb2xlL3VuaW1lZC0ke2FjY291bnQuc3RhZ2V9J2AsXG4vLyAgICAgYGF3cyAtLXByb2ZpbGUgdW5pbWVkLSR7YWNjb3VudC5zdGFnZX0gY29uZmlndXJlIHNldCByZWdpb24gJHtBbGxvd2VkUmVnaW9ucy5ldUNlbnRyYWwxfWAsXG4vLyAgIF07XG4vLyB9XG5cbmV4cG9ydCBjbGFzcyBVSVBpcGVsaW5lU3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBpZDogc3RyaW5nLCBwcm9wczogVUlQaXBlbGluZVN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihhcHAsIGlkLCBwcm9wcyk7XG5cbiAgICBUYWdzLm9mKHRoaXMpLmFkZCgnRnJvbnRlbmRQaXBlbGluZScsIHRoaXMuc3RhY2tOYW1lKTtcblxuICAgIC8vIGNvbnN0IHBpcGVsaW5lID0gbmV3IFBpcGVsaW5lKHRoaXMsIGAke3RoaXMuc3RhY2tOYW1lfS1waXBlbGluZWAsIHtcbiAgICAvLyAgIHBpcGVsaW5lTmFtZTogYCR7dGhpcy5zdGFja05hbWV9LXBpcGVsaW5lYCxcbiAgICAvLyB9KTtcblxuICAgIC8vIGNvbnN0IGNka0RlcGxveVJvbGUgPSBuZXcgUm9sZSh0aGlzLCAnY3JlYXRlSW5zdGFuY2VCdWlsZFJvbGUnLCB7XG4gICAgLy8gICBhc3N1bWVkQnk6IG5ldyBTZXJ2aWNlUHJpbmNpcGFsKCdjb2RlYnVpbGQuYW1hem9uYXdzLmNvbScpLFxuICAgIC8vICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgLy8gICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBZG1pbmlzdHJhdG9yQWNjZXNzJyksXG4gICAgLy8gICBdLFxuICAgIC8vIH0pO1xuXG5cbiAgICBjb25zdCBzb3VyY2VPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoKTtcblxuICAgIC8vIGNvbnN0IG9hdXRoID0gU3RyaW5nUGFyYW1ldGVyLnZhbHVlRm9yU2VjdXJlU3RyaW5nUGFyYW1ldGVyKFxuICAgIC8vICAgdGhpcywgJ211bGxlcjg4LWdpdGh1Yi10b2tlbicsIDEpO1xuICAgIGNvbnN0IG9hdXRoID0gU2VjcmV0VmFsdWUuc2VjcmV0c01hbmFnZXIoJ2FsZmNkaycsIHtcbiAgICAgIGpzb25GaWVsZDogJ211bGxlcjg4LWdpdGh1Yi10b2tlbicsXG4gICAgfSk7XG5cbiAgICBjb25zdCBnaXRTb3VyY2UgPSBuZXcgR2l0SHViU291cmNlQWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6ICdHaXRodWJTb3VyY2UnLFxuICAgICAgYnJhbmNoOiBwcm9wcy5icmFuY2gsXG4gICAgICBvd25lcjogJ21tdWxsZXI4OCcsXG4gICAgICByZXBvOiAnYWxmLWNkay11aScsXG4gICAgICBvYXV0aFRva2VuOiBvYXV0aCxcbiAgICAgIG91dHB1dDogc291cmNlT3V0cHV0LFxuICAgIH0pO1xuXG4gICAgLy8gcGlwZWxpbmUuYWRkU3RhZ2Uoe1xuICAgIC8vICAgc3RhZ2VOYW1lOiAnU291cmNlJyxcbiAgICAvLyAgIGFjdGlvbnM6IFtcbiAgICAvLyAgICAgZ2l0U291cmNlLFxuICAgIC8vICAgXSxcbiAgICAvLyB9KTtcblxuICAgIGNvbnN0IHNvdXJjZUFydGlmYWN0ID0gbmV3IEFydGlmYWN0KCk7XG4gICAgY29uc3QgY2xvdWRBc3NlbWJseUFydGlmYWN0ID0gbmV3IEFydGlmYWN0KCk7XG5cbiAgICBjb25zdCBwaXBlbGluZSA9IG5ldyBDZGtQaXBlbGluZSh0aGlzLCAnUGlwZWxpbmUnLCB7XG4gICAgICAvLyBUaGUgcGlwZWxpbmUgbmFtZVxuICAgICAgcGlwZWxpbmVOYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tcGlwZWxpbmVgLFxuICAgICAgY2xvdWRBc3NlbWJseUFydGlmYWN0LFxuXG4gICAgICAvLyBXaGVyZSB0aGUgc291cmNlIGNhbiBiZSBmb3VuZFxuICAgICAgc291cmNlQWN0aW9uOiBnaXRTb3VyY2UsXG5cbiAgICAgICAvLyBIb3cgaXQgd2lsbCBiZSBidWlsdCBhbmQgc3ludGhlc2l6ZWRcbiAgICAgICBzeW50aEFjdGlvbjogU2ltcGxlU3ludGhBY3Rpb24uc3RhbmRhcmROcG1TeW50aCh7XG4gICAgICAgICBzb3VyY2VBcnRpZmFjdCxcbiAgICAgICAgIGNsb3VkQXNzZW1ibHlBcnRpZmFjdCxcblxuICAgICAgICAgLy8gV2UgbmVlZCBhIGJ1aWxkIHN0ZXAgdG8gY29tcGlsZSB0aGUgVHlwZVNjcmlwdCBMYW1iZGFcbiAgICAgICAgIGJ1aWxkQ29tbWFuZDogJ25wbSBydW4gYnVpbGQnXG4gICAgICAgfSksXG4gICAgfSk7XG5cbiAgICAvLyB0b2RvOiBhZGQgZGV2QWNjb3VudCBsYXRlclxuICAgIGZvciAoY29uc3QgYWNjb3VudCBvZiBbcHJvZEFjY291bnRdKSB7XG4gICAgICBwaXBlbGluZS5hZGRBcHBsaWNhdGlvblN0YWdlKG5ldyBGcm9udGVuZFN0YWdlKHRoaXMsICdGcm9udGVuZFN0YWdlJywge1xuICAgICAgICBlbnY6IHtcbiAgICAgICAgICBhY2NvdW50OiBhY2NvdW50LmlkLFxuICAgICAgICAgIHJlZ2lvbjogYWNjb3VudC5yZWdpb24sXG4gICAgICAgIH0sXG4gICAgICB9KSk7XG4gICAgfVxuICB9XG59XG4iXX0=