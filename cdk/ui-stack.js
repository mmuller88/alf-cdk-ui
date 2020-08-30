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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1aS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3Q0FBaUU7QUFDakUsd0VBQWtFO0FBQ2xFLGtFQUFzRTtBQUN0RSw0REFNaUM7QUFDakMsc0RBQWdGO0FBQ2hGLHNFQUFnRTtBQUtoRSxhQUFhO0FBQ2Isc0NBQXVDO0FBWXZDLE1BQWEsT0FBUSxTQUFRLElBQUksQ0FBQyxLQUFLO0lBRXJDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBbUI7UUFDM0QsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxxQ0FBZ0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLFVBQVUsRUFBRTtZQUMxRCxVQUFVLEVBQUUsR0FBRyxLQUFLLENBQUMsU0FBUyxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUU7WUFDcEQsb0JBQW9CLEVBQUUsWUFBWTtZQUNsQyxvQkFBb0IsRUFBRSxZQUFZO1lBQ2xDLGFBQWEsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDMUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxhQUFhLEdBQUcsSUFBSSxxQ0FBb0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO1lBQzFELE9BQU8sRUFBRSxXQUFXLEtBQUssQ0FBQyxVQUFVLFdBQVc7U0FDaEQsQ0FBQyxDQUFDO1FBRUgsTUFBTSxtQkFBbUIsR0FBbUM7WUFDMUQsa0JBQWtCLEVBQUU7Z0JBQ2hCLFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtnQkFDNUIsS0FBSyxFQUFFLENBQUUsR0FBRyxLQUFLLENBQUMsU0FBUyxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBRTtnQkFDbkQsU0FBUyxFQUFFLDBCQUFTLENBQUMsR0FBRztnQkFDeEIsY0FBYyxFQUFFLHVDQUFzQixDQUFDLGFBQWE7YUFDdkQ7WUFDRCxhQUFhLEVBQUU7Z0JBQ2I7b0JBQ0UsY0FBYyxFQUFFO3dCQUNkLGNBQWMsRUFBRSxNQUFNO3dCQUN0QixvQkFBb0IsRUFBRSxhQUFhO3FCQUNwQztvQkFDRCxTQUFTLEVBQUUsQ0FBQyxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxDQUFDO2lCQUN6QzthQUNGO1lBQ0QsbUJBQW1CLEVBQUU7Z0JBQ25CO29CQUNFLFNBQVMsRUFBRSxHQUFHO29CQUNkLGtCQUFrQixFQUFFLEVBQUU7b0JBQ3RCLFlBQVksRUFBRSxHQUFHO29CQUNqQixnQkFBZ0IsRUFBRSxhQUFhO2lCQUNoQzthQUNGO1NBQ0YsQ0FBQztRQUVGLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSwwQ0FBeUIsQ0FDMUQsSUFBSSxFQUNKLEdBQUcsS0FBSyxDQUFDLFNBQVMsSUFBSSxLQUFLLENBQUMsVUFBVSxNQUFNLEVBQzVDLG1CQUFtQixDQUNwQixDQUFDO1FBRUYsSUFBSSxvQ0FBZ0IsQ0FBQyxJQUFJLEVBQUUsYUFBYSxJQUFJLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLEVBQUU7WUFDL0QsT0FBTyxFQUFFLENBQUMsMEJBQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbkMsaUJBQWlCLEVBQUUsTUFBTTtZQUN6QixZQUFZLEVBQUUsc0JBQXNCO1lBQ3BDLGlCQUFpQixFQUFFLENBQUMsR0FBRyxDQUFDO1NBQ3pCLENBQUMsQ0FBQztRQUVILE1BQU0sSUFBSSxHQUFHLHdCQUFVLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsRUFBRSxVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDbkYsTUFBTSxLQUFLLEdBQUcsSUFBSSxxQkFBTyxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUNqRCxVQUFVLEVBQUUsR0FBRyxLQUFLLENBQUMsU0FBUyxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUU7WUFDcEQsTUFBTSxFQUFFLGlDQUFtQixDQUFDLFNBQVMsQ0FBQyxJQUFJLHNDQUFnQixDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDbkYsSUFBSTtTQUNMLENBQUMsQ0FBQztRQUVILElBQUksZ0JBQVMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFO1lBQzNCLEtBQUssRUFBRSxLQUFLLENBQUMsVUFBVTtTQUN4QixDQUFDLENBQUM7SUFDTCxDQUFDO0NBRUY7QUFuRUQsMEJBbUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU3RhY2tQcm9wcywgQ29uc3RydWN0LCBDZm5PdXRwdXQgfSBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCB7IEF1dG9EZWxldGVCdWNrZXQgfSBmcm9tICdAbW9iaWxlcG9zc2UvYXV0by1kZWxldGUtYnVja2V0J1xuaW1wb3J0IHsgQnVja2V0RGVwbG95bWVudCwgU291cmNlIH0gZnJvbSAnQGF3cy1jZGsvYXdzLXMzLWRlcGxveW1lbnQnO1xuaW1wb3J0IHtcbiAgQ2xvdWRGcm9udFdlYkRpc3RyaWJ1dGlvbixcbiAgQ2xvdWRGcm9udFdlYkRpc3RyaWJ1dGlvblByb3BzLFxuICBPcmlnaW5BY2Nlc3NJZGVudGl0eSxcbiAgU1NMTWV0aG9kLFxuICBTZWN1cml0eVBvbGljeVByb3RvY29sXG59IGZyb20gJ0Bhd3MtY2RrL2F3cy1jbG91ZGZyb250JztcbmltcG9ydCB7IEFSZWNvcmQsIEFkZHJlc3NSZWNvcmRUYXJnZXQsIEhvc3RlZFpvbmUgfSBmcm9tICdAYXdzLWNkay9hd3Mtcm91dGU1Myc7XG5pbXBvcnQgeyBDbG91ZEZyb250VGFyZ2V0IH0gZnJvbSAnQGF3cy1jZGsvYXdzLXJvdXRlNTMtdGFyZ2V0cyc7XG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgY29kZWRlcGxveSA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1jb2RlZGVwbG95Jyk7XG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgbGFtYmRhID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWxhbWJkYScpO1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IGNvcmUgPSByZXF1aXJlKCdAYXdzLWNkay9jb3JlJyk7XG5cblxuZXhwb3J0IGludGVyZmFjZSBVSVN0YWNrUHJvcHMgZXh0ZW5kcyBTdGFja1Byb3BzIHtcbiAgc3RhZ2U6IHN0cmluZztcbiAgYWNtQ2VydFJlZjogc3RyaW5nO1xuICBkb21haW5OYW1lOiBzdHJpbmc7XG4gIHN1YkRvbWFpbjogc3RyaW5nO1xuICAvLyBkZXBsb3llZEF0OiBzdHJpbmc7XG4gIC8vIGFwcFZlcnNpb246IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFVJU3RhY2sgZXh0ZW5kcyBjb3JlLlN0YWNrIHtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogVUlTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBidWNrZXQgPSBuZXcgQXV0b0RlbGV0ZUJ1Y2tldCh0aGlzLCBwcm9wcy5kb21haW5OYW1lLCB7XG4gICAgICBidWNrZXROYW1lOiBgJHtwcm9wcy5zdWJEb21haW59LiR7cHJvcHMuZG9tYWluTmFtZX1gLFxuICAgICAgd2Vic2l0ZUluZGV4RG9jdW1lbnQ6ICdpbmRleC5odG1sJyxcbiAgICAgIHdlYnNpdGVFcnJvckRvY3VtZW50OiAnaW5kZXguaHRtbCcsXG4gICAgICByZW1vdmFsUG9saWN5OiBjb3JlLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGNsb3VkRnJvbnRPQUkgPSBuZXcgT3JpZ2luQWNjZXNzSWRlbnRpdHkodGhpcywgJ09BSScsIHtcbiAgICAgIGNvbW1lbnQ6IGBPQUkgZm9yICR7cHJvcHMuZG9tYWluTmFtZX0gd2Vic2l0ZS5gLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY2xvdWRGcm9udERpc3RQcm9wczogQ2xvdWRGcm9udFdlYkRpc3RyaWJ1dGlvblByb3BzID0ge1xuICAgICAgYWxpYXNDb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgYWNtQ2VydFJlZjogcHJvcHMuYWNtQ2VydFJlZixcbiAgICAgICAgICBuYW1lczogWyBgJHtwcm9wcy5zdWJEb21haW59LiR7cHJvcHMuZG9tYWluTmFtZX1gIF0sXG4gICAgICAgICAgc3NsTWV0aG9kOiBTU0xNZXRob2QuU05JLFxuICAgICAgICAgIHNlY3VyaXR5UG9saWN5OiBTZWN1cml0eVBvbGljeVByb3RvY29sLlRMU19WMV8xXzIwMTYsXG4gICAgICB9LFxuICAgICAgb3JpZ2luQ29uZmlnczogW1xuICAgICAgICB7XG4gICAgICAgICAgczNPcmlnaW5Tb3VyY2U6IHtcbiAgICAgICAgICAgIHMzQnVja2V0U291cmNlOiBidWNrZXQsXG4gICAgICAgICAgICBvcmlnaW5BY2Nlc3NJZGVudGl0eTogY2xvdWRGcm9udE9BSSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJlaGF2aW9yczogW3sgaXNEZWZhdWx0QmVoYXZpb3I6IHRydWUgfV0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgZXJyb3JDb25maWd1cmF0aW9uczogW1xuICAgICAgICB7XG4gICAgICAgICAgZXJyb3JDb2RlOiA0MDQsXG4gICAgICAgICAgZXJyb3JDYWNoaW5nTWluVHRsOiA2MCxcbiAgICAgICAgICByZXNwb25zZUNvZGU6IDIwMCxcbiAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiBcIi9pbmRleC5odG1sXCJcbiAgICAgICAgfVxuICAgICAgXVxuICAgIH07XG5cbiAgICBjb25zdCBjbG91ZGZyb250RGlzdHJpYnV0aW9uID0gbmV3IENsb3VkRnJvbnRXZWJEaXN0cmlidXRpb24oXG4gICAgICB0aGlzLFxuICAgICAgYCR7cHJvcHMuc3ViRG9tYWlufS4ke3Byb3BzLmRvbWFpbk5hbWV9LWNmZGAsXG4gICAgICBjbG91ZEZyb250RGlzdFByb3BzXG4gICAgKTtcblxuICAgIG5ldyBCdWNrZXREZXBsb3ltZW50KHRoaXMsIGBEZXBsb3lBcHAtJHtuZXcgRGF0ZSgpLnRvU3RyaW5nKCl9YCwge1xuICAgICAgc291cmNlczogW1NvdXJjZS5hc3NldChcIi4uL2J1aWxkXCIpXSxcbiAgICAgIGRlc3RpbmF0aW9uQnVja2V0OiBidWNrZXQsXG4gICAgICBkaXN0cmlidXRpb246IGNsb3VkZnJvbnREaXN0cmlidXRpb24sXG4gICAgICBkaXN0cmlidXRpb25QYXRoczogWycvJ10sXG4gICAgfSk7XG5cbiAgICBjb25zdCB6b25lID0gSG9zdGVkWm9uZS5mcm9tTG9va3VwKHRoaXMsICdab25lJywgeyBkb21haW5OYW1lOiBwcm9wcy5kb21haW5OYW1lIH0pO1xuICAgIGNvbnN0IHJvdXRlID0gbmV3IEFSZWNvcmQodGhpcywgJ1NpdGVBbGlhc1JlY29yZCcsIHtcbiAgICAgIHJlY29yZE5hbWU6IGAke3Byb3BzLnN1YkRvbWFpbn0uJHtwcm9wcy5kb21haW5OYW1lfWAsXG4gICAgICB0YXJnZXQ6IEFkZHJlc3NSZWNvcmRUYXJnZXQuZnJvbUFsaWFzKG5ldyBDbG91ZEZyb250VGFyZ2V0KGNsb3VkZnJvbnREaXN0cmlidXRpb24pKSxcbiAgICAgIHpvbmVcbiAgICB9KTtcblxuICAgIG5ldyBDZm5PdXRwdXQodGhpcywgJ3JvdXRlJywge1xuICAgICAgdmFsdWU6IHJvdXRlLmRvbWFpbk5hbWUsXG4gICAgfSk7XG4gIH1cblxufVxuIl19