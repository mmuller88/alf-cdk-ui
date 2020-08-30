"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIStack = void 0;
const auto_delete_bucket_1 = require("@mobileposse/auto-delete-bucket");
const aws_s3_deployment_1 = require("@aws-cdk/aws-s3-deployment");
const aws_cloudfront_1 = require("@aws-cdk/aws-cloudfront");
const aws_route53_1 = require("@aws-cdk/aws-route53");
const aws_route53_targets_1 = require("@aws-cdk/aws-route53-targets");
// @ts-ignore
const core = require("@aws-cdk/core");
class UIStack extends core.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const bucket = new auto_delete_bucket_1.AutoDeleteBucket(this, props.domainName, {
            bucketName: `${props.subDomain}.${props.domainName}`,
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'index.html',
            removalPolicy: core.RemovalPolicy.DESTROY,
        });
        const cloudFrontOAI = new aws_cloudfront_1.OriginAccessIdentity(this, 'OAI', {
            comment: `OAI for ${props.domainName} website.`,
        });
        const cloudFrontDistProps = {
            aliasConfiguration: {
                acmCertRef: props.acmCertRef,
                names: [`${props.subDomain}.${props.domainName}`],
                sslMethod: aws_cloudfront_1.SSLMethod.SNI,
                securityPolicy: aws_cloudfront_1.SecurityPolicyProtocol.TLS_V1_1_2016,
            },
            originConfigs: [
                {
                    s3OriginSource: {
                        s3BucketSource: bucket,
                        originAccessIdentity: cloudFrontOAI,
                    },
                    behaviors: [{ isDefaultBehavior: true }],
                },
            ],
            errorConfigurations: [
                {
                    errorCode: 404,
                    errorCachingMinTtl: 60,
                    responseCode: 200,
                    responsePagePath: "/index.html"
                }
            ]
        };
        const cloudfrontDistribution = new aws_cloudfront_1.CloudFrontWebDistribution(this, `${props.subDomain}.${props.domainName}-cfd`, cloudFrontDistProps);
        new aws_s3_deployment_1.BucketDeployment(this, `DeployApp-${new Date().toString()}`, {
            sources: [aws_s3_deployment_1.Source.asset("../build")],
            destinationBucket: bucket,
            distribution: cloudfrontDistribution,
            distributionPaths: ['/'],
        });
        const zone = aws_route53_1.HostedZone.fromLookup(this, 'Zone', { domainName: props.domainName });
        new aws_route53_1.ARecord(this, 'SiteAliasRecord', {
            recordName: `${props.subDomain}.${props.domainName}`,
            target: aws_route53_1.AddressRecordTarget.fromAlias(new aws_route53_targets_1.CloudFrontTarget(cloudfrontDistribution)),
            zone
        });
    }
}
exports.UIStack = UIStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1aS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSx3RUFBa0U7QUFDbEUsa0VBQXNFO0FBQ3RFLDREQU1pQztBQUNqQyxzREFBZ0Y7QUFDaEYsc0VBQWdFO0FBS2hFLGFBQWE7QUFDYixzQ0FBdUM7QUFZdkMsTUFBYSxPQUFRLFNBQVEsSUFBSSxDQUFDLEtBQUs7SUFFckMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFtQjtRQUMzRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLE1BQU0sR0FBRyxJQUFJLHFDQUFnQixDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsVUFBVSxFQUFFO1lBQzFELFVBQVUsRUFBRSxHQUFHLEtBQUssQ0FBQyxTQUFTLElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRTtZQUNwRCxvQkFBb0IsRUFBRSxZQUFZO1lBQ2xDLG9CQUFvQixFQUFFLFlBQVk7WUFDbEMsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTztTQUMxQyxDQUFDLENBQUM7UUFFSCxNQUFNLGFBQWEsR0FBRyxJQUFJLHFDQUFvQixDQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7WUFDMUQsT0FBTyxFQUFFLFdBQVcsS0FBSyxDQUFDLFVBQVUsV0FBVztTQUNoRCxDQUFDLENBQUM7UUFFSCxNQUFNLG1CQUFtQixHQUFtQztZQUMxRCxrQkFBa0IsRUFBRTtnQkFDaEIsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO2dCQUM1QixLQUFLLEVBQUUsQ0FBRSxHQUFHLEtBQUssQ0FBQyxTQUFTLElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFFO2dCQUNuRCxTQUFTLEVBQUUsMEJBQVMsQ0FBQyxHQUFHO2dCQUN4QixjQUFjLEVBQUUsdUNBQXNCLENBQUMsYUFBYTthQUN2RDtZQUNELGFBQWEsRUFBRTtnQkFDYjtvQkFDRSxjQUFjLEVBQUU7d0JBQ2QsY0FBYyxFQUFFLE1BQU07d0JBQ3RCLG9CQUFvQixFQUFFLGFBQWE7cUJBQ3BDO29CQUNELFNBQVMsRUFBRSxDQUFDLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLENBQUM7aUJBQ3pDO2FBQ0Y7WUFDRCxtQkFBbUIsRUFBRTtnQkFDbkI7b0JBQ0UsU0FBUyxFQUFFLEdBQUc7b0JBQ2Qsa0JBQWtCLEVBQUUsRUFBRTtvQkFDdEIsWUFBWSxFQUFFLEdBQUc7b0JBQ2pCLGdCQUFnQixFQUFFLGFBQWE7aUJBQ2hDO2FBQ0Y7U0FDRixDQUFDO1FBRUYsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLDBDQUF5QixDQUMxRCxJQUFJLEVBQ0osR0FBRyxLQUFLLENBQUMsU0FBUyxJQUFJLEtBQUssQ0FBQyxVQUFVLE1BQU0sRUFDNUMsbUJBQW1CLENBQ3BCLENBQUM7UUFFRixJQUFJLG9DQUFnQixDQUFDLElBQUksRUFBRSxhQUFhLElBQUksSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRTtZQUMvRCxPQUFPLEVBQUUsQ0FBQywwQkFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNuQyxpQkFBaUIsRUFBRSxNQUFNO1lBQ3pCLFlBQVksRUFBRSxzQkFBc0I7WUFDcEMsaUJBQWlCLEVBQUUsQ0FBQyxHQUFHLENBQUM7U0FDekIsQ0FBQyxDQUFDO1FBRUgsTUFBTSxJQUFJLEdBQUcsd0JBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUNuRixJQUFJLHFCQUFPLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ25DLFVBQVUsRUFBRSxHQUFHLEtBQUssQ0FBQyxTQUFTLElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRTtZQUNwRCxNQUFNLEVBQUUsaUNBQW1CLENBQUMsU0FBUyxDQUFDLElBQUksc0NBQWdCLENBQUMsc0JBQXNCLENBQUMsQ0FBQztZQUNuRixJQUFJO1NBQ0wsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUVGO0FBL0RELDBCQStEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFN0YWNrUHJvcHMsIENvbnN0cnVjdCB9IGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0IHsgQXV0b0RlbGV0ZUJ1Y2tldCB9IGZyb20gJ0Btb2JpbGVwb3NzZS9hdXRvLWRlbGV0ZS1idWNrZXQnXG5pbXBvcnQgeyBCdWNrZXREZXBsb3ltZW50LCBTb3VyY2UgfSBmcm9tICdAYXdzLWNkay9hd3MtczMtZGVwbG95bWVudCc7XG5pbXBvcnQge1xuICBDbG91ZEZyb250V2ViRGlzdHJpYnV0aW9uLFxuICBDbG91ZEZyb250V2ViRGlzdHJpYnV0aW9uUHJvcHMsXG4gIE9yaWdpbkFjY2Vzc0lkZW50aXR5LFxuICBTU0xNZXRob2QsXG4gIFNlY3VyaXR5UG9saWN5UHJvdG9jb2xcbn0gZnJvbSAnQGF3cy1jZGsvYXdzLWNsb3VkZnJvbnQnO1xuaW1wb3J0IHsgQVJlY29yZCwgQWRkcmVzc1JlY29yZFRhcmdldCwgSG9zdGVkWm9uZSB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1yb3V0ZTUzJztcbmltcG9ydCB7IENsb3VkRnJvbnRUYXJnZXQgfSBmcm9tICdAYXdzLWNkay9hd3Mtcm91dGU1My10YXJnZXRzJztcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCBjb2RlZGVwbG95ID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWNvZGVkZXBsb3knKTtcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCBsYW1iZGEgPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtbGFtYmRhJyk7XG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgY29yZSA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2NvcmUnKTtcblxuXG5leHBvcnQgaW50ZXJmYWNlIFVJU3RhY2tQcm9wcyBleHRlbmRzIFN0YWNrUHJvcHMge1xuICBzdGFnZTogc3RyaW5nO1xuICBhY21DZXJ0UmVmOiBzdHJpbmc7XG4gIGRvbWFpbk5hbWU6IHN0cmluZztcbiAgc3ViRG9tYWluOiBzdHJpbmc7XG4gIC8vIGRlcGxveWVkQXQ6IHN0cmluZztcbiAgLy8gYXBwVmVyc2lvbjogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgVUlTdGFjayBleHRlbmRzIGNvcmUuU3RhY2sge1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBVSVN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IGJ1Y2tldCA9IG5ldyBBdXRvRGVsZXRlQnVja2V0KHRoaXMsIHByb3BzLmRvbWFpbk5hbWUsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGAke3Byb3BzLnN1YkRvbWFpbn0uJHtwcm9wcy5kb21haW5OYW1lfWAsXG4gICAgICB3ZWJzaXRlSW5kZXhEb2N1bWVudDogJ2luZGV4Lmh0bWwnLFxuICAgICAgd2Vic2l0ZUVycm9yRG9jdW1lbnQ6ICdpbmRleC5odG1sJyxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNvcmUuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY2xvdWRGcm9udE9BSSA9IG5ldyBPcmlnaW5BY2Nlc3NJZGVudGl0eSh0aGlzLCAnT0FJJywge1xuICAgICAgY29tbWVudDogYE9BSSBmb3IgJHtwcm9wcy5kb21haW5OYW1lfSB3ZWJzaXRlLmAsXG4gICAgfSk7XG5cbiAgICBjb25zdCBjbG91ZEZyb250RGlzdFByb3BzOiBDbG91ZEZyb250V2ViRGlzdHJpYnV0aW9uUHJvcHMgPSB7XG4gICAgICBhbGlhc0NvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICBhY21DZXJ0UmVmOiBwcm9wcy5hY21DZXJ0UmVmLFxuICAgICAgICAgIG5hbWVzOiBbIGAke3Byb3BzLnN1YkRvbWFpbn0uJHtwcm9wcy5kb21haW5OYW1lfWAgXSxcbiAgICAgICAgICBzc2xNZXRob2Q6IFNTTE1ldGhvZC5TTkksXG4gICAgICAgICAgc2VjdXJpdHlQb2xpY3k6IFNlY3VyaXR5UG9saWN5UHJvdG9jb2wuVExTX1YxXzFfMjAxNixcbiAgICAgIH0sXG4gICAgICBvcmlnaW5Db25maWdzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzM09yaWdpblNvdXJjZToge1xuICAgICAgICAgICAgczNCdWNrZXRTb3VyY2U6IGJ1Y2tldCxcbiAgICAgICAgICAgIG9yaWdpbkFjY2Vzc0lkZW50aXR5OiBjbG91ZEZyb250T0FJLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYmVoYXZpb3JzOiBbeyBpc0RlZmF1bHRCZWhhdmlvcjogdHJ1ZSB9XSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBlcnJvckNvbmZpZ3VyYXRpb25zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBlcnJvckNvZGU6IDQwNCxcbiAgICAgICAgICBlcnJvckNhY2hpbmdNaW5UdGw6IDYwLFxuICAgICAgICAgIHJlc3BvbnNlQ29kZTogMjAwLFxuICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6IFwiL2luZGV4Lmh0bWxcIlxuICAgICAgICB9XG4gICAgICBdXG4gICAgfTtcblxuICAgIGNvbnN0IGNsb3VkZnJvbnREaXN0cmlidXRpb24gPSBuZXcgQ2xvdWRGcm9udFdlYkRpc3RyaWJ1dGlvbihcbiAgICAgIHRoaXMsXG4gICAgICBgJHtwcm9wcy5zdWJEb21haW59LiR7cHJvcHMuZG9tYWluTmFtZX0tY2ZkYCxcbiAgICAgIGNsb3VkRnJvbnREaXN0UHJvcHNcbiAgICApO1xuXG4gICAgbmV3IEJ1Y2tldERlcGxveW1lbnQodGhpcywgYERlcGxveUFwcC0ke25ldyBEYXRlKCkudG9TdHJpbmcoKX1gLCB7XG4gICAgICBzb3VyY2VzOiBbU291cmNlLmFzc2V0KFwiLi4vYnVpbGRcIildLFxuICAgICAgZGVzdGluYXRpb25CdWNrZXQ6IGJ1Y2tldCxcbiAgICAgIGRpc3RyaWJ1dGlvbjogY2xvdWRmcm9udERpc3RyaWJ1dGlvbixcbiAgICAgIGRpc3RyaWJ1dGlvblBhdGhzOiBbJy8nXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHpvbmUgPSBIb3N0ZWRab25lLmZyb21Mb29rdXAodGhpcywgJ1pvbmUnLCB7IGRvbWFpbk5hbWU6IHByb3BzLmRvbWFpbk5hbWUgfSk7XG4gICAgbmV3IEFSZWNvcmQodGhpcywgJ1NpdGVBbGlhc1JlY29yZCcsIHtcbiAgICAgIHJlY29yZE5hbWU6IGAke3Byb3BzLnN1YkRvbWFpbn0uJHtwcm9wcy5kb21haW5OYW1lfWAsXG4gICAgICB0YXJnZXQ6IEFkZHJlc3NSZWNvcmRUYXJnZXQuZnJvbUFsaWFzKG5ldyBDbG91ZEZyb250VGFyZ2V0KGNsb3VkZnJvbnREaXN0cmlidXRpb24pKSxcbiAgICAgIHpvbmVcbiAgICB9KTtcbiAgfVxuXG59XG4iXX0=