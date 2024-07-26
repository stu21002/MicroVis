#include <omp.h>
#include <iostream>

int main() {

    omp_set_num_threads(6);
    #pragma omp parallel
    {
        int thread_id = omp_get_thread_num();
        int num_threads = omp_get_num_threads();
        std::cout << "Hello from thread " << thread_id << " out of " << num_threads << " threads\n";
    }
    return 0;
}
