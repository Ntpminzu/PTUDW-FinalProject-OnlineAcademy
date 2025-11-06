import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH;

async function uploadFile(fileBuffer, pathOnRepo) {
    if (!fileBuffer) {
        throw new Error('No file buffer provided');
    }

    if (!Buffer.isBuffer(fileBuffer)) {
        throw new Error('Invalid file buffer');
    }

    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${pathOnRepo}`;

    const base64Content = fileBuffer.toString('base64');

    const body = {
        message: `Upload file`,
        content: base64Content,
        branch: GITHUB_BRANCH
    };

    try {
        const response = await axios.put(apiUrl, body, {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 201) {
            const filePath = response.data.content.path;
            return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${filePath}`;
        } else {
            throw new Error(`GitHub upload failed with status: ${response.status}`);
        }
    } catch (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }
}

export default uploadFile;
