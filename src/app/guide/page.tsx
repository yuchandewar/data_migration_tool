import Link from 'next/link';

export default function GuidePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          <Link href="/">Universal Data Migration</Link>
        </h1>
        <nav className="flex space-x-4">
          <Link href="/connections" className="text-sm font-medium text-gray-600 hover:text-gray-900">Connections</Link>
          <Link href="/jobs" className="text-sm font-medium text-gray-600 hover:text-gray-900">Jobs</Link>
          <Link href="/convert" className="text-sm font-medium text-gray-600 hover:text-gray-900">Quick Convert</Link>
          <Link href="/guide" className="text-sm font-medium text-gray-900 border-b-2 border-gray-900 pb-1">Guide</Link>
        </nav>
      </header>

      <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Getting Started Guide</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Welcome to the Universal Data Migration tool. Learn how to connect databases, visually map schemas, and seamlessly transform your data.
          </p>
        </div>

        <div className="space-y-12">
          
          {/* Section 1 */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center mb-4 space-x-3">
              <div className="bg-blue-100 text-blue-700 font-bold w-10 h-10 rounded-full flex items-center justify-center text-xl">1</div>
              <h3 className="text-2xl font-bold text-gray-900">Set Up Your Connections</h3>
            </div>
            <div className="ml-13 text-gray-600 space-y-4">
              <p>
                Before you can migrate data, you need to tell the tool where your data lives (Source) and where it should go (Destination).
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Navigate to the <Link href="/connections" className="text-indigo-600 hover:underline font-medium">Connections</Link> tab.</li>
                <li>Click <strong>New Connection</strong>.</li>
                <li>Select your database type (PostgreSQL, MySQL, MongoDB, CSV, or API).</li>
                <li>Enter your credentials or a direct Connection URL.</li>
              </ul>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4 rounded-r text-sm">
                <strong>Tip:</strong> If you're using a local CSV folder, simply select "CSV" and enter the folder path (e.g., <code>C:/data/</code>) as the File Path!
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center mb-4 space-x-3">
              <div className="bg-indigo-100 text-indigo-700 font-bold w-10 h-10 rounded-full flex items-center justify-center text-xl">2</div>
              <h3 className="text-2xl font-bold text-gray-900">Run a Migration Job</h3>
            </div>
            <div className="ml-13 text-gray-600 space-y-4">
              <p>
                Once your connections are saved, you can create a Job to move data securely from one connection to another while transforming it on the fly.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Navigate to the <Link href="/jobs" className="text-indigo-600 hover:underline font-medium">Jobs</Link> tab and click <strong>Create Migration Job</strong>.</li>
                <li><strong>Select Source:</strong> Pick your source database. The tool will auto-suggest tables and collections available in that database!</li>
                <li><strong>Visual Schema Mapping:</strong> The tool will automatically detect your columns. You can choose to <code>Pass Through</code>, <code>Rename</code>, <code>Drop</code>, or <code>Cast</code> (change type) for each individual column.</li>
                <li>If your collection is completely empty, you can use the <strong>+ Add Field Manually</strong> button to define your expected columns.</li>
                <li><strong>Select Destination:</strong> Pick where the data should end up, save the job, and click <strong>Run Now</strong>!</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center mb-4 space-x-3">
              <div className="bg-amber-100 text-amber-700 font-bold w-10 h-10 rounded-full flex items-center justify-center text-xl">3</div>
              <h3 className="text-2xl font-bold text-gray-900">Use the Quick Convert Tool</h3>
            </div>
            <div className="ml-13 text-gray-600 space-y-4">
              <p>
                Don't want to set up databases? Need to quickly convert a local file? The <strong>Quick Convert</strong> tool is a powerful drag-and-drop feature for instantaneous structural changes.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Navigate to the <Link href="/convert" className="text-indigo-600 hover:underline font-medium">Quick Convert</Link> tab.</li>
                <li>Drag and drop a <code>.csv</code> or <code>.json</code> file into the dotted box.</li>
                <li><strong>Customize Structure:</strong> Use dot-notation (e.g., <code>user.profile.name</code>) to convert flat CSV columns into beautifully nested JSON structures.</li>
                <li>Watch the <strong>Live Code Preview</strong> update instantly as you type!</li>
                <li>Download your customized structure immediately with the click of a button.</li>
              </ul>
            </div>
          </section>

        </div>

        <div className="mt-12 text-center">
          <Link href="/connections">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-colors text-lg">
              Get Started Now
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
