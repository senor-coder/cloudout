# Cloudout
 Code generator for your AWS cloud resource.

## Contents
- [Quick Start](#quick-start)

## <a name="quick-start"></a>Quick Start

1. **Install via npm:**

```bash
npm install -g cloudout
```

2. **Create your resource template:**

Create the resource file referencing your cloud resources by one of the following
    - Cloudformation output
    - SSM Parameter store

Lets create a template file cloudout.yml

```yaml
S3Buckets:
  website: cf:my_org_website:bucket_name
  #cf - This is for cloudformation
  #my_org_website - This the cloudformation stack name
  #bucket_name - This is the output key in the stack


Domains:
  domain_name: ssm:/prod/website/domain_name
  #ssm - This is for SSM ParameterStore
  #/prod/website/domain_name - This is the parameter name

```


3. **Generate code**

To generate the python file
```bash
cloudout -r us-east-1 -t python -i cloudout.yml -o resources.py
```

Output:
```python
class S3Buckets(str):
  website = 'actual_bucket_name'


class Domains(str):
  domain_name = 'mydomain.com'


```