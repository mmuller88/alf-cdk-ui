"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIStack = void 0;
const core_1 = require("@aws-cdk/core");
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
        const route = new aws_route53_1.ARecord(this, 'SiteAliasRecord', {
            recordName: `${props.subDomain}.${props.domainName}`,
            target: aws_route53_1.AddressRecordTarget.fromAlias(new aws_route53_targets_1.CloudFrontTarget(cloudfrontDistribution)),
            zone
        });
        new core_1.CfnOutput(this, 'route', {
            value: route.domainName,
        });
    }
}
exports.UIStack = UIStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9jZGsvdWktc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsd0NBQWlFO0FBQ2pFLHdFQUFrRTtBQUNsRSxrRUFBc0U7QUFDdEUsNERBTWlDO0FBQ2pDLHNEQUFnRjtBQUNoRixzRUFBZ0U7QUFLaEUsYUFBYTtBQUNiLHNDQUF1QztBQVl2QyxNQUFhLE9BQVEsU0FBUSxJQUFJLENBQUMsS0FBSztJQUVyQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQW1CO1FBQzNELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sTUFBTSxHQUFHLElBQUkscUNBQWdCLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxVQUFVLEVBQUU7WUFDMUQsVUFBVSxFQUFFLEdBQUcsS0FBSyxDQUFDLFNBQVMsSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFO1lBQ3BELG9CQUFvQixFQUFFLFlBQVk7WUFDbEMsb0JBQW9CLEVBQUUsWUFBWTtZQUNsQyxhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPO1NBQzFDLENBQUMsQ0FBQztRQUVILE1BQU0sYUFBYSxHQUFHLElBQUkscUNBQW9CLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtZQUMxRCxPQUFPLEVBQUUsV0FBVyxLQUFLLENBQUMsVUFBVSxXQUFXO1NBQ2hELENBQUMsQ0FBQztRQUVILE1BQU0sbUJBQW1CLEdBQW1DO1lBQzFELGtCQUFrQixFQUFFO2dCQUNoQixVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVU7Z0JBQzVCLEtBQUssRUFBRSxDQUFFLEdBQUcsS0FBSyxDQUFDLFNBQVMsSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUU7Z0JBQ25ELFNBQVMsRUFBRSwwQkFBUyxDQUFDLEdBQUc7Z0JBQ3hCLGNBQWMsRUFBRSx1Q0FBc0IsQ0FBQyxhQUFhO2FBQ3ZEO1lBQ0QsYUFBYSxFQUFFO2dCQUNiO29CQUNFLGNBQWMsRUFBRTt3QkFDZCxjQUFjLEVBQUUsTUFBTTt3QkFDdEIsb0JBQW9CLEVBQUUsYUFBYTtxQkFDcEM7b0JBQ0QsU0FBUyxFQUFFLENBQUMsRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsQ0FBQztpQkFDekM7YUFDRjtZQUNELG1CQUFtQixFQUFFO2dCQUNuQjtvQkFDRSxTQUFTLEVBQUUsR0FBRztvQkFDZCxrQkFBa0IsRUFBRSxFQUFFO29CQUN0QixZQUFZLEVBQUUsR0FBRztvQkFDakIsZ0JBQWdCLEVBQUUsYUFBYTtpQkFDaEM7YUFDRjtTQUNGLENBQUM7UUFFRixNQUFNLHNCQUFzQixHQUFHLElBQUksMENBQXlCLENBQzFELElBQUksRUFDSixHQUFHLEtBQUssQ0FBQyxTQUFTLElBQUksS0FBSyxDQUFDLFVBQVUsTUFBTSxFQUM1QyxtQkFBbUIsQ0FDcEIsQ0FBQztRQUVGLElBQUksb0NBQWdCLENBQUMsSUFBSSxFQUFFLGFBQWEsSUFBSSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxFQUFFO1lBQy9ELE9BQU8sRUFBRSxDQUFDLDBCQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ25DLGlCQUFpQixFQUFFLE1BQU07WUFDekIsWUFBWSxFQUFFLHNCQUFzQjtZQUNwQyxpQkFBaUIsRUFBRSxDQUFDLEdBQUcsQ0FBQztTQUN6QixDQUFDLENBQUM7UUFFSCxNQUFNLElBQUksR0FBRyx3QkFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQ25GLE1BQU0sS0FBSyxHQUFHLElBQUkscUJBQU8sQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDakQsVUFBVSxFQUFFLEdBQUcsS0FBSyxDQUFDLFNBQVMsSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFO1lBQ3BELE1BQU0sRUFBRSxpQ0FBbUIsQ0FBQyxTQUFTLENBQUMsSUFBSSxzQ0FBZ0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ25GLElBQUk7U0FDTCxDQUFDLENBQUM7UUFFSCxJQUFJLGdCQUFTLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRTtZQUMzQixLQUFLLEVBQUUsS0FBSyxDQUFDLFVBQVU7U0FDeEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUVGO0FBbkVELDBCQW1FQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFN0YWNrUHJvcHMsIENvbnN0cnVjdCwgQ2ZuT3V0cHV0IH0gZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgeyBBdXRvRGVsZXRlQnVja2V0IH0gZnJvbSAnQG1vYmlsZXBvc3NlL2F1dG8tZGVsZXRlLWJ1Y2tldCdcbmltcG9ydCB7IEJ1Y2tldERlcGxveW1lbnQsIFNvdXJjZSB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1zMy1kZXBsb3ltZW50JztcbmltcG9ydCB7XG4gIENsb3VkRnJvbnRXZWJEaXN0cmlidXRpb24sXG4gIENsb3VkRnJvbnRXZWJEaXN0cmlidXRpb25Qcm9wcyxcbiAgT3JpZ2luQWNjZXNzSWRlbnRpdHksXG4gIFNTTE1ldGhvZCxcbiAgU2VjdXJpdHlQb2xpY3lQcm90b2NvbFxufSBmcm9tICdAYXdzLWNkay9hd3MtY2xvdWRmcm9udCc7XG5pbXBvcnQgeyBBUmVjb3JkLCBBZGRyZXNzUmVjb3JkVGFyZ2V0LCBIb3N0ZWRab25lIH0gZnJvbSAnQGF3cy1jZGsvYXdzLXJvdXRlNTMnO1xuaW1wb3J0IHsgQ2xvdWRGcm9udFRhcmdldCB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1yb3V0ZTUzLXRhcmdldHMnO1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IGNvZGVkZXBsb3kgPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtY29kZWRlcGxveScpO1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IGxhbWJkYSA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1sYW1iZGEnKTtcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCBjb3JlID0gcmVxdWlyZSgnQGF3cy1jZGsvY29yZScpO1xuXG5cbmV4cG9ydCBpbnRlcmZhY2UgVUlTdGFja1Byb3BzIGV4dGVuZHMgU3RhY2tQcm9wcyB7XG4gIHN0YWdlOiBzdHJpbmc7XG4gIGFjbUNlcnRSZWY6IHN0cmluZztcbiAgZG9tYWluTmFtZTogc3RyaW5nO1xuICBzdWJEb21haW46IHN0cmluZztcbiAgLy8gZGVwbG95ZWRBdDogc3RyaW5nO1xuICAvLyBhcHBWZXJzaW9uOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBVSVN0YWNrIGV4dGVuZHMgY29yZS5TdGFjayB7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFVJU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3QgYnVja2V0ID0gbmV3IEF1dG9EZWxldGVCdWNrZXQodGhpcywgcHJvcHMuZG9tYWluTmFtZSwge1xuICAgICAgYnVja2V0TmFtZTogYCR7cHJvcHMuc3ViRG9tYWlufS4ke3Byb3BzLmRvbWFpbk5hbWV9YCxcbiAgICAgIHdlYnNpdGVJbmRleERvY3VtZW50OiAnaW5kZXguaHRtbCcsXG4gICAgICB3ZWJzaXRlRXJyb3JEb2N1bWVudDogJ2luZGV4Lmh0bWwnLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY29yZS5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG5cbiAgICBjb25zdCBjbG91ZEZyb250T0FJID0gbmV3IE9yaWdpbkFjY2Vzc0lkZW50aXR5KHRoaXMsICdPQUknLCB7XG4gICAgICBjb21tZW50OiBgT0FJIGZvciAke3Byb3BzLmRvbWFpbk5hbWV9IHdlYnNpdGUuYCxcbiAgICB9KTtcblxuICAgIGNvbnN0IGNsb3VkRnJvbnREaXN0UHJvcHM6IENsb3VkRnJvbnRXZWJEaXN0cmlidXRpb25Qcm9wcyA9IHtcbiAgICAgIGFsaWFzQ29uZmlndXJhdGlvbjoge1xuICAgICAgICAgIGFjbUNlcnRSZWY6IHByb3BzLmFjbUNlcnRSZWYsXG4gICAgICAgICAgbmFtZXM6IFsgYCR7cHJvcHMuc3ViRG9tYWlufS4ke3Byb3BzLmRvbWFpbk5hbWV9YCBdLFxuICAgICAgICAgIHNzbE1ldGhvZDogU1NMTWV0aG9kLlNOSSxcbiAgICAgICAgICBzZWN1cml0eVBvbGljeTogU2VjdXJpdHlQb2xpY3lQcm90b2NvbC5UTFNfVjFfMV8yMDE2LFxuICAgICAgfSxcbiAgICAgIG9yaWdpbkNvbmZpZ3M6IFtcbiAgICAgICAge1xuICAgICAgICAgIHMzT3JpZ2luU291cmNlOiB7XG4gICAgICAgICAgICBzM0J1Y2tldFNvdXJjZTogYnVja2V0LFxuICAgICAgICAgICAgb3JpZ2luQWNjZXNzSWRlbnRpdHk6IGNsb3VkRnJvbnRPQUksXG4gICAgICAgICAgfSxcbiAgICAgICAgICBiZWhhdmlvcnM6IFt7IGlzRGVmYXVsdEJlaGF2aW9yOiB0cnVlIH1dLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIGVycm9yQ29uZmlndXJhdGlvbnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGVycm9yQ29kZTogNDA0LFxuICAgICAgICAgIGVycm9yQ2FjaGluZ01pblR0bDogNjAsXG4gICAgICAgICAgcmVzcG9uc2VDb2RlOiAyMDAsXG4gICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogXCIvaW5kZXguaHRtbFwiXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9O1xuXG4gICAgY29uc3QgY2xvdWRmcm9udERpc3RyaWJ1dGlvbiA9IG5ldyBDbG91ZEZyb250V2ViRGlzdHJpYnV0aW9uKFxuICAgICAgdGhpcyxcbiAgICAgIGAke3Byb3BzLnN1YkRvbWFpbn0uJHtwcm9wcy5kb21haW5OYW1lfS1jZmRgLFxuICAgICAgY2xvdWRGcm9udERpc3RQcm9wc1xuICAgICk7XG5cbiAgICBuZXcgQnVja2V0RGVwbG95bWVudCh0aGlzLCBgRGVwbG95QXBwLSR7bmV3IERhdGUoKS50b1N0cmluZygpfWAsIHtcbiAgICAgIHNvdXJjZXM6IFtTb3VyY2UuYXNzZXQoXCIuLi9idWlsZFwiKV0sXG4gICAgICBkZXN0aW5hdGlvbkJ1Y2tldDogYnVja2V0LFxuICAgICAgZGlzdHJpYnV0aW9uOiBjbG91ZGZyb250RGlzdHJpYnV0aW9uLFxuICAgICAgZGlzdHJpYnV0aW9uUGF0aHM6IFsnLyddLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgem9uZSA9IEhvc3RlZFpvbmUuZnJvbUxvb2t1cCh0aGlzLCAnWm9uZScsIHsgZG9tYWluTmFtZTogcHJvcHMuZG9tYWluTmFtZSB9KTtcbiAgICBjb25zdCByb3V0ZSA9IG5ldyBBUmVjb3JkKHRoaXMsICdTaXRlQWxpYXNSZWNvcmQnLCB7XG4gICAgICByZWNvcmROYW1lOiBgJHtwcm9wcy5zdWJEb21haW59LiR7cHJvcHMuZG9tYWluTmFtZX1gLFxuICAgICAgdGFyZ2V0OiBBZGRyZXNzUmVjb3JkVGFyZ2V0LmZyb21BbGlhcyhuZXcgQ2xvdWRGcm9udFRhcmdldChjbG91ZGZyb250RGlzdHJpYnV0aW9uKSksXG4gICAgICB6b25lXG4gICAgfSk7XG5cbiAgICBuZXcgQ2ZuT3V0cHV0KHRoaXMsICdyb3V0ZScsIHtcbiAgICAgIHZhbHVlOiByb3V0ZS5kb21haW5OYW1lLFxuICAgIH0pO1xuICB9XG5cbn1cbiJdfQ==