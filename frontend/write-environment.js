const fs = require('fs');

const devTargetPath = './src/environments/environment.ts';
const prodTargetPath = './src/environments/environment.prod.ts';

// Creating the environment files in the CI to be used within the build process.
// As the environment contains secrets, they cannot be checked in
const envContent = `${process.env.ENVIRONMENT_PROD}`;

try {
  fs.writeFileSync(devTargetPath, envContent);
  if (fs.existsSync(devTargetPath)) {
    console.log(`Angular environment.ts file generated correctly at ${devTargetPath} \n`);
  }
  
  fs.writeFileSync(prodTargetPath, envContent);
  if (fs.existsSync(prodTargetPath)) {
    console.log(`Angular environment.prod.ts file generated correctly at ${prodTargetPath} \n`);
  }
} catch (error) {
  console.error(error);
  process.exit(1);
}
